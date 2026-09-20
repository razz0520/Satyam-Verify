"""Authentication and User Management Service.

Handles user registration, login with rate-limiting & account lockout,
Google OAuth, JWT token issuance & refresh, MFA management, and role-based access control.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    blacklist_token,
    check_rate_limit,
    create_access_token,
    create_google_registration_token,
    create_refresh_token,
    decode_token,
    exchange_code_for_tokens,
    generate_secure_token,
    get_google_user_info,
    hash_password,
    increment_rate_counter,
    is_account_locked,
    record_failed_login,
    reset_failed_logins,
    verify_google_id_token,
    verify_google_registration_token,
    verify_password,
    verify_token,
    verify_totp,
)
from app.core.signature_service import generate_ed25519_keypair, serialize_public_key
from app.models.database import (
    AuditLog,
    Credential,
    CredentialStatus,
    CredentialType,
    DomainWhitelist,
    User,
    UserRole,
)

logger = logging.getLogger(__name__)

# Role hierarchy levels for permission evaluation
ROLE_HIERARCHY: Dict[UserRole, int] = {
    UserRole.VIEWER: 1,
    UserRole.PUBLISHER: 2,
    UserRole.ADMIN: 3,
}


class AuthService:
    """Authentication and User Lifecycle Service."""

    # =================================================================       
    # 1. Authentication Flow
    # =================================================================       

    @classmethod
    def authenticate_user(
        cls,
        db: Session,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Authenticate a user via email and password with rate limiting & lockout defense.

        Args:
            db: SQLAlchemy session.
            email: User's registered email.
            password: Raw plaintext password.
            ip_address: Client IP.
            user_agent: Client User Agent.

        Returns:
            Dictionary with access_token, refresh_token, token_type, and user metadata.

        Raises:
            ValueError: On invalid credentials, account locked, or inactive user.
        """
        clean_email = email.strip().lower()

        # Check 1: Account lockout
        is_locked, remaining_sec = is_account_locked(clean_email)
        if is_locked:
            logger.warning("Authentication attempt on locked account: %s", clean_email)
            raise ValueError(f"Account is temporarily locked. Try again in {remaining_sec} seconds.")

        # Check 2: Rate limit on email/IP
        rate_id = f"login:{clean_email}"
        if not check_rate_limit(rate_id, max_requests=10, window_seconds=60):
            logger.warning("Rate limit exceeded for %s", clean_email)
            raise ValueError("Too many login attempts. Please wait a minute and try again.")

        increment_rate_counter(rate_id, window_seconds=60)

        # Lookup user
        user = db.execute(select(User).where(User.email == clean_email)).scalar_one_or_none()

        if not user or not user.password_hash or not verify_password(password, user.password_hash):
            is_now_locked, remaining_attempts = record_failed_login(clean_email)

            # Audit failure
            audit = AuditLog(
                actor_id=user.id if user else None,
                action="LOGIN_FAILED",
                details={
                    "email": clean_email,
                    "reason": "Invalid credentials",
                    "remaining_attempts": remaining_attempts,
                },
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(audit)
            db.commit()

            if is_now_locked:
                raise ValueError("Account locked due to excessive failed login attempts. Try again in 15 minutes.")
            raise ValueError(f"Invalid email or password. {remaining_attempts} attempts remaining.")

        # Check 3: Active status
        if not user.is_active:
            logger.warning("Login attempt on deactivated account: %s", clean_email)
            raise ValueError("Account has been deactivated. Please contact an administrator.")

        # Reset failed login count on successful password
        reset_failed_logins(clean_email)

        # Update login stats
        now = datetime.now(timezone.utc)
        user.last_login_at = now
        user.last_login_ip = ip_address
        user.login_count += 1

        # Check MFA requirement
        if user.mfa_enabled and user.mfa_secret:
            mfa_session_token = create_access_token(
                user_id=user.id,
                role=user.role,
                expires_delta=timedelta(minutes=5),
                extra_claims={"mfa_pending": True},
            )
            audit = AuditLog(
                actor_id=user.id,
                action="MFA_PROMPT",
                details={"email": clean_email},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(audit)
            db.commit()

            return {
                "mfa_required": True,
                "mfa_session_token": mfa_session_token,
                "user_id": str(user.id),
                "user": user.to_dict(),
                "access_token": None,
                "refresh_token": None,
                "token_type": "bearer",
            }

        # Issue JWT tokens
        audit = AuditLog(
            actor_id=user.id,
            action="LOGIN_SUCCESS",
            details={"email": clean_email},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        access_token = create_access_token(user_id=user.id, role=user.role)
        refresh_token = create_refresh_token(user_id=user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "mfa_required": False,
            "user": user.to_dict(),
        }

    @classmethod
    def verify_mfa_login(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
        totp_code: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Verify TOTP code after initial password authentication to complete login.

        Args:
            db: SQLAlchemy session.
            user_id: User UUID.
            totp_code: 6-digit TOTP string.
            ip_address: Client IP.
            user_agent: Client User Agent.

        Returns:
            Dictionary with access_token, refresh_token, and user metadata.
        """
        uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        user = db.execute(select(User).where(User.id == uid)).scalar_one_or_none()

        if not user or not user.mfa_secret:
            raise ValueError("MFA not configured for this user")

        if not verify_totp(user.mfa_secret, totp_code):
            audit = AuditLog(
                actor_id=user.id,
                action="MFA_FAILED",
                details={"reason": "Invalid TOTP code"},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(audit)
            db.commit()
            raise ValueError("Invalid authentication code")

        audit = AuditLog(
            actor_id=user.id,
            action="MFA_SUCCESS",
            details={},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit)
        db.commit()

        access_token = create_access_token(user_id=user.id, role=user.role)
        refresh_token = create_refresh_token(user_id=user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "mfa_required": False,
            "user": user.to_dict(),
        }

    @classmethod
    def authenticate_with_google(
        cls,
        db: Session,
        code: str,
        redirect_uri: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Authenticate a user using Google OAuth 2.0 with strict identity & account linking checks.

        Decision Tree:
        1. CASE 1 - Existing user with matching google_id -> Normal login.
        2. CASE 3 - Existing user with matching email but unlinked google_id -> Require password login & linking (DO NOT auto-link).
        3. CASE 2 - Genuinely new user -> Issue short-lived signed registration token.
        """
        # Step 1: Exchange code for Google tokens
        token_data = exchange_code_for_tokens(code, redirect_uri=redirect_uri)
        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise ValueError("Failed to retrieve access token from Google")

        # Step 2: Fetch Google user profile
        user_info = get_google_user_info(google_access_token)
        google_id = user_info.get("sub")
        email = user_info.get("email", "").strip().lower()
        name = user_info.get("name", "")

        if not email or not google_id:
            raise ValueError("Incomplete profile received from Google")

        # Step 3: CASE 1 - Existing User matched by google_id
        user_by_google_id = db.execute(
            select(User).where(User.google_id == google_id)
        ).scalar_one_or_none()

        if user_by_google_id:
            user = user_by_google_id
            if not user.is_active:
                raise ValueError("Account has been deactivated. Please contact an administrator.")

            now = datetime.now(timezone.utc)
            user.last_login_at = now
            user.last_login_ip = ip_address
            user.login_count += 1

            audit = AuditLog(
                actor_id=user.id,
                action="GOOGLE_LOGIN_SUCCESS",
                details={"email": email, "google_id": google_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(audit)
            db.commit()
            db.refresh(user)

            access_token = create_access_token(user_id=user.id, role=user.role)
            refresh_token = create_refresh_token(user_id=user.id)

            return {
                "registered": True,
                "google_link_required": False,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "mfa_required": False,
                "user": user.to_dict(),
            }

        # Step 4: CASE 3 - Existing password account with matching email but unlinked google_id
        user_by_email = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

        if user_by_email:
            # DO NOT auto-link unlinked accounts. Require password authentication first.
            logger.warning(
                "Google login attempt for unlinked account %s (Google ID: %s). Link required.",
                email,
                google_id,
            )
            return {
                "registered": True,
                "google_link_required": True,
                "email": email,
                "message": "An account already exists with this email. Sign in with your password first to securely link Google.",
            }

        # Step 5: CASE 2 - Genuinely New User
        # Issue short-lived signed registration token (10 minutes)
        registration_token = create_google_registration_token(
            email=email,
            google_id=google_id,
            name=name,
            expires_minutes=10,
        )

        logger.info("New Google user verified: %s, issued registration token", email)
        return {
            "registered": False,
            "google_link_required": False,
            "registration_token": registration_token,
            "email": email,
            "name": name,
            "given_name": user_info.get("given_name") or "",
            "family_name": user_info.get("family_name") or "",
            "message": "Google authentication verified. Please complete publisher registration.",
        }

    @classmethod
    def refresh_tokens(cls, db: Session, refresh_token: str) -> Dict[str, Any]:
        """
        Exchange a valid refresh token for a fresh access and refresh token pair.

        Args:
            db: SQLAlchemy session.
            refresh_token: Signed refresh JWT string.

        Returns:
            Dictionary with new access_token, refresh_token, and token_type.
        """
        payload = verify_token(refresh_token, expected_type="refresh")
        user_id = payload.get("sub")

        if not user_id:
            raise ValueError("Invalid token subject")

        uid = uuid.UUID(user_id)
        user = db.execute(select(User).where(User.id == uid)).scalar_one_or_none()

        if not user or not user.is_active:
            raise ValueError("User account is inactive or not found")

        # Invalidate old refresh token (Token rotation)
        blacklist_token(refresh_token)

        # Generate new token pair
        new_access = create_access_token(user_id=user.id, role=user.role)
        new_refresh = create_refresh_token(user_id=user.id)

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
        }

    @classmethod
    def logout_user(
        cls,
        token: str,
        user_id: Optional[Union[str, uuid.UUID]] = None,
        db: Optional[Session] = None,
    ) -> bool:
        """
        Revoke the active token and log audit event.

        Args:
            token: Access or refresh token to blacklist.
            user_id: User identifier.
            db: Optional SQLAlchemy session for audit logging.

        Returns:
            True on successful logout.
        """
        blacklist_token(token)

        if db and user_id:
            try:
                uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
                audit = AuditLog(
                    actor_id=uid,
                    action="USER_LOGOUT",
                    details={},
                )
                db.add(audit)
                db.commit()
            except Exception as e:
                logger.warning("Could not record logout audit log: %s", e)

        return True

    # ========================================================================
    # 2. Registration Flow
    # ========================================================================

    @classmethod
    def register_publisher(
        cls,
        db: Session,
        email: str,
        password: str,
        organization_name: str,
        organization_domain: str,
        department: Optional[str] = None,
        designation: Optional[str] = None,
        registration_token: Optional[str] = None,
    ) -> User:
        """
        Register a new Publisher user with Ed25519 cryptographic keypair.
        If a valid Google registration token is supplied, binds the verified google_id.

        Args:
            db: SQLAlchemy session.
            email: Publisher official email.
            password: Password string.
            organization_name: Government department/organization.
            organization_domain: Official organization domain (e.g., gov.in).
            department: Sub-department or division.
            designation: Official title/designation.
            registration_token: Optional signed Google registration JWT.

        Returns:
            Created User instance.
        """
        clean_email = email.strip().lower()
        clean_domain = organization_domain.strip().lower()

        google_id: Optional[str] = None
        google_email: Optional[str] = None

        if registration_token:
            token_payload = verify_google_registration_token(registration_token)
            token_email = token_payload.get("email", "").strip().lower()
            token_google_id = token_payload.get("google_id")

            if clean_email != token_email:
                raise ValueError(
                    f"Registration email ({clean_email}) does not match verified Google token email ({token_email})"
                )

            # Ensure google_id is not already taken
            existing_google = db.execute(
                select(User).where(User.google_id == token_google_id)
            ).scalar_one_or_none()
            if existing_google:
                raise ValueError("This Google account is already registered with another user")

            google_id = token_google_id
            google_email = token_email

        # Check existing user by email
        existing = db.execute(select(User).where(User.email == clean_email)).scalar_one_or_none()
        if existing:
            raise ValueError(f"Email {clean_email} is already registered")

        # Generate Ed25519 keypair for publisher
        _, pub_key = generate_ed25519_keypair()
        pub_pem = serialize_public_key(pub_key)

        hashed_pw = hash_password(password)

        user = User(
            email=clean_email,
            password_hash=hashed_pw,
            role=UserRole.PUBLISHER,
            organization_name=organization_name.strip(),
            organization_domain=clean_domain,
            department=department.strip() if department else None,
            designation=designation.strip() if designation else None,
            google_id=google_id,
            google_email=google_email,
            public_key=pub_pem,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.flush()

        # Create Primary Credential
        now = datetime.now(timezone.utc)
        cred = Credential(
            publisher_id=user.id,
            credential_type=CredentialType.PRIMARY,
            status=CredentialStatus.ACTIVE,
            valid_from=now,
            valid_until=now + timedelta(days=365),
        )
        db.add(cred)

        # Audit
        audit = AuditLog(
            actor_id=user.id,
            action="USER_REGISTER_PUBLISHER",
            details={
                "email": clean_email,
                "organization": organization_name,
                "google_linked": bool(google_id),
            },
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        logger.info("Registered new publisher: %s (%s, Google linked: %s)", clean_email, user.id, bool(google_id))
        return user

    @classmethod
    def link_google_to_user(
        cls,
        db: Session,
        current_user: User,
        code: str,
        redirect_uri: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Link a verified Google account to the currently authenticated application user.

        Security checks:
        1. Authorization code is exchanged with Google for tokens.
        2. Google profile is fetched and verified.
        3. Google email must match authenticated current_user.email (case-insensitive).
        4. google_id must not already be linked to another user.
        5. Saves google_id and google_email on current_user record.
        """
        token_data = exchange_code_for_tokens(code, redirect_uri=redirect_uri)
        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise ValueError("Failed to retrieve access token from Google")

        user_info = get_google_user_info(google_access_token)
        google_id = user_info.get("sub")
        email = user_info.get("email", "").strip().lower()

        if not email or not google_id:
            raise ValueError("Incomplete profile received from Google")

        if current_user.email.strip().lower() != email:
            raise ValueError(
                f"Google account email ({email}) does not match your authenticated account email ({current_user.email})"
            )

        existing_google_user = db.execute(
            select(User).where((User.google_id == google_id) & (User.id != current_user.id))
        ).scalar_one_or_none()
        if existing_google_user:
            raise ValueError("This Google account is already linked to another account")

        current_user.google_id = google_id
        current_user.google_email = email

        audit = AuditLog(
            actor_id=current_user.id,
            action="GOOGLE_ACCOUNT_LINKED",
            details={"email": email, "google_id": google_id},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit)
        db.commit()
        db.refresh(current_user)

        logger.info("Successfully linked Google ID %s to user %s", google_id, current_user.id)
        return {
            "message": "Google account linked successfully.",
            "google_id": google_id,
            "email": email,
        }

    @classmethod
    def register_admin(
        cls,
        db: Session,
        email: str,
        password: str,
        organization_name: str = "National Provenance Authority",
        organization_domain: str = "gov.in",
    ) -> User:
        """
        Register a new Admin user.

        Args:
            db: SQLAlchemy session.
            email: Admin email.
            password: Password string.
            organization_name: Organization name.
            organization_domain: Organization domain.

        Returns:
            Created Admin User.
        """
        clean_email = email.strip().lower()

        existing = db.execute(select(User).where(User.email == clean_email)).scalar_one_or_none()
        if existing:
            raise ValueError(f"Email {clean_email} is already registered")

        _, pub_key = generate_ed25519_keypair()
        pub_pem = serialize_public_key(pub_key)

        user = User(
            email=clean_email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            organization_name=organization_name,
            organization_domain=organization_domain,
            public_key=pub_pem,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        audit = AuditLog(
            actor_id=user.id,
            action="USER_REGISTER_ADMIN",
            details={"email": clean_email},
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        logger.info("Registered new admin: %s (%s)", clean_email, user.id)
        return user

    @classmethod
    def verify_email(cls, db: Session, token: str) -> bool:
        """
        Verify email address using a verification token.

        Args:
            db: SQLAlchemy session.
            token: Verification token containing user_id in 'sub'.

        Returns:
            True on successful verification.
        """
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return False

        uid = uuid.UUID(user_id)
        user = db.execute(select(User).where(User.id == uid)).scalar_one_or_none()
        if not user:
            return False

        user.is_verified = True
        db.commit()
        logger.info("Email verified for user: %s", user.email)
        return True

    @classmethod
    def resend_verification_email(cls, db: Session, email: str) -> str:
        """
        Generate a new verification token for a user.

        Args:
            db: SQLAlchemy session.
            email: User's email.

        Returns:
            JWT verification token string.
        """
        clean_email = email.strip().lower()
        user = db.execute(select(User).where(User.email == clean_email)).scalar_one_or_none()
        if not user:
            raise ValueError(f"No user found with email {email}")

        token = create_access_token(
            user_id=user.id,
            role=user.role,
            expires_delta=timedelta(hours=24),
            extra_claims={"purpose": "email_verification"},
        )
        return token

    # ========================================================================
    # 3. User Management
    # ========================================================================

    @classmethod
    def get_user_by_id(cls, db: Session, user_id: Union[str, uuid.UUID]) -> Optional[User]:
        """Fetch user by UUID primary key."""
        uid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        return db.execute(select(User).where(User.id == uid)).scalar_one_or_none()

    @classmethod
    def get_user_by_email(cls, db: Session, email: str) -> Optional[User]:
        """Fetch user by email."""
        return db.execute(select(User).where(User.email == email.strip().lower())).scalar_one_or_none()

    @classmethod
    def update_user_profile(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
        data: Dict[str, Any],
    ) -> User:
        """
        Update user profile attributes.

        Args:
            db: SQLAlchemy session.
            user_id: Target user UUID.
            data: Dictionary of fields to update.

        Returns:
            Updated User.
        """
        user = cls.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        allowed_fields = [
            "organization_name",
            "department",
            "designation",
            "mfa_enabled",
            "mfa_secret",
            "public_key",
        ]

        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])

        if "password" in data and data["password"]:
            user.password_hash = hash_password(data["password"])

        db.commit()
        db.refresh(user)
        logger.info("Updated profile for user: %s", user.id)
        return user

    @classmethod
    def deactivate_user(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
        reason: Optional[str] = None,
    ) -> User:
        """Deactivate a user account."""
        user = cls.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        user.is_active = False
        audit = AuditLog(
            actor_id=user.id,
            action="USER_DEACTIVATED",
            details={"reason": reason or "Administrative deactivation"},
        )
        db.add(audit)
        db.commit()
        db.refresh(user)
        logger.info("Deactivated user: %s", user.id)
        return user

    @classmethod
    def reactivate_user(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
    ) -> User:
        """Reactivate a suspended/deactivated user account."""
        user = cls.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        user.is_active = True
        audit = AuditLog(
            actor_id=user.id,
            action="USER_REACTIVATED",
            details={},
        )
        db.add(audit)
        db.commit()
        db.refresh(user)
        logger.info("Reactivated user: %s", user.id)
        return user

    # ========================================================================
    # 4. Role Management & Access Control
    # ========================================================================

    @classmethod
    def assign_role(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
        role: Union[str, UserRole],
    ) -> User:
        """
        Assign a new role to a user.

        Args:
            db: SQLAlchemy session.
            user_id: Target user UUID.
            role: Target UserRole enum or string.

        Returns:
            Updated User.
        """
        user = cls.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        new_role = UserRole(role) if isinstance(role, str) else role
        old_role = user.role
        user.role = new_role

        audit = AuditLog(
            actor_id=user.id,
            action="ROLE_ASSIGNED",
            details={"old_role": old_role.value, "new_role": new_role.value},
        )
        db.add(audit)
        db.commit()
        db.refresh(user)
        logger.info("Assigned role %s to user %s (was %s)", new_role.value, user.id, old_role.value)
        return user

    @classmethod
    def check_permission(
        cls,
        db: Session,
        user_id: Union[str, uuid.UUID],
        required_role: Union[str, UserRole],
    ) -> bool:
        """
        Verify if user has sufficient hierarchical role permissions.

        Args:
            db: SQLAlchemy session.
            user_id: Target user UUID.
            required_role: Minimum required role.

        Returns:
            True if user's role meets or exceeds required_role hierarchy level.
        """
        user = cls.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            return False

        req_role_enum = UserRole(required_role) if isinstance(required_role, str) else required_role
        user_level = ROLE_HIERARCHY.get(user.role, 0)
        required_level = ROLE_HIERARCHY.get(req_role_enum, 0)

        return user_level >= required_level

    @classmethod
    def get_user_roles(cls, db: Session, user_id: Union[str, uuid.UUID]) -> List[str]:
        """Get list of active roles assigned to a user."""
        user = cls.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            return []
        return [user.role.value]


# Functional convenience aliases
authenticate_user = AuthService.authenticate_user
verify_mfa_login = AuthService.verify_mfa_login
authenticate_with_google = AuthService.authenticate_with_google
refresh_tokens = AuthService.refresh_tokens
logout_user = AuthService.logout_user
register_publisher = AuthService.register_publisher
register_admin = AuthService.register_admin
verify_email = AuthService.verify_email
resend_verification_email = AuthService.resend_verification_email
get_user_by_id = AuthService.get_user_by_id
get_user_by_email = AuthService.get_user_by_email
update_user_profile = AuthService.update_user_profile
deactivate_user = AuthService.deactivate_user
reactivate_user = AuthService.reactivate_user
assign_role = AuthService.assign_role
check_permission = AuthService.check_permission
get_user_roles = AuthService.get_user_roles
link_google_to_user = AuthService.link_google_to_user

