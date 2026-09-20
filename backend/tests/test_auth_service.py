import datetime
import uuid
import pytest
from sqlalchemy import select

from app.database import engine, SessionLocal
from app.models import User, UserRole, Credential, AuditLog, DomainWhitelist
from app.core.security import (
    hash_password,
    verify_password,
    generate_secure_token,
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token,
    blacklist_token,
    is_token_blacklisted,
    generate_totp_secret,
    verify_totp,
    generate_backup_codes,
    check_rate_limit,
    increment_rate_counter,
    reset_rate_counter,
    record_failed_login,
    is_account_locked,
    reset_failed_logins,
    get_google_auth_url,
)
from app.services.auth_service import (
    AuthService,
    register_publisher,
    register_admin,
    authenticate_user,
    verify_mfa_login,
    refresh_tokens,
    logout_user,
    verify_email,
    resend_verification_email,
    get_user_by_id,
    get_user_by_email,
    update_user_profile,
    deactivate_user,
    reactivate_user,
    assign_role,
    check_permission,
    get_user_roles,
)
import pyotp


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ============================================================================
# 1. Password & Token Unit Tests
# ============================================================================

def test_password_hashing():
    pw = "SuperSecret#2026"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_lifecycle_and_blacklisting():
    uid = uuid.uuid4()
    access_token = create_access_token(uid, UserRole.PUBLISHER)
    refresh_token = create_refresh_token(uid)

    # Verify valid access token
    claims = verify_token(access_token, expected_type="access")
    assert claims["sub"] == str(uid)
    assert claims["role"] == "PUBLISHER"
    assert claims["type"] == "access"

    # Verify valid refresh token
    r_claims = verify_token(refresh_token, expected_type="refresh")
    assert r_claims["sub"] == str(uid)
    assert r_claims["type"] == "refresh"

    # Blacklist access token
    assert is_token_blacklisted(access_token) is False
    blacklist_token(access_token)
    assert is_token_blacklisted(access_token) is True

    # Verifying blacklisted token raises ValueError
    with pytest.raises(ValueError, match="revoked"):
        verify_token(access_token, expected_type="access")


def test_mfa_totp():
    secret = generate_totp_secret()
    assert len(secret) == 32

    # Generate valid current TOTP code
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    assert verify_totp(secret, valid_code) is True
    assert verify_totp(secret, "000000") is False

    # Backup codes
    backup_codes = generate_backup_codes(count=5)
    assert len(backup_codes) == 5
    assert all("-" in code for code in backup_codes)


def test_rate_limiting_and_account_lockout():
    identifier = f"test_user_{uuid.uuid4().hex[:6]}@gov.in"

    reset_rate_counter(identifier)
    reset_failed_logins(identifier)

    # Test rate limit
    for _ in range(3):
        increment_rate_counter(identifier, window_seconds=60)

    assert check_rate_limit(identifier, max_requests=5, window_seconds=60) is True
    for _ in range(3):
        increment_rate_counter(identifier, window_seconds=60)
    assert check_rate_limit(identifier, max_requests=5, window_seconds=60) is False

    # Test account lockout
    test_id = f"lockout_{uuid.uuid4().hex[:6]}@gov.in"
    for i in range(4):
        is_locked, remaining = record_failed_login(test_id, max_attempts=5, lockout_seconds=300)
        assert is_locked is False
        assert remaining == 5 - (i + 1)

    # 5th attempt locks out
    is_locked, remaining = record_failed_login(test_id, max_attempts=5, lockout_seconds=300)
    assert is_locked is True
    assert remaining == 0

    locked, _ = is_account_locked(test_id)
    assert locked is True

    reset_failed_logins(test_id)
    locked_after_reset, _ = is_account_locked(test_id)
    assert locked_after_reset is False


# ============================================================================
# 2. Registration & Authentication Integration Tests
# ============================================================================

def test_publisher_and_admin_registration(db):
    email_pub = f"pub_{uuid.uuid4().hex[:6]}@pib.gov.in"
    publisher = register_publisher(
        db=db,
        email=email_pub,
        password="PublisherSecure#123",
        organization_name="Press Information Bureau",
        organization_domain="pib.gov.in",
        department="Central Bureau",
        designation="Information Officer",
    )

    assert publisher.id is not None
    assert publisher.role == UserRole.PUBLISHER
    assert publisher.public_key is not None
    assert "BEGIN PUBLIC KEY" in publisher.public_key
    assert len(publisher.credentials) == 1
    assert publisher.credentials[0].credential_type.value == "PRIMARY"

    # Admin Registration
    email_admin = f"admin_{uuid.uuid4().hex[:6]}@gov.in"
    admin = register_admin(
        db=db,
        email=email_admin,
        password="AdminSecure#123",
    )
    assert admin.id is not None
    assert admin.role == UserRole.ADMIN
    assert admin.is_verified is True


def test_user_authentication_flow(db):
    email = f"auth_user_{uuid.uuid4().hex[:6]}@gov.in"
    password = "AuthPassword#123"

    user = register_publisher(
        db=db,
        email=email,
        password=password,
        organization_name="Gov Dept",
        organization_domain="gov.in",
    )

    # Successful login
    auth_result = authenticate_user(db, email, password)
    assert "access_token" in auth_result
    assert "refresh_token" in auth_result
    assert auth_result["user"]["email"] == email
    assert auth_result["mfa_required"] is False

    # Bad password
    with pytest.raises(ValueError, match="Invalid email or password"):
        authenticate_user(db, email, "WrongPassword")

    # Refresh tokens
    ref_res = refresh_tokens(db, auth_result["refresh_token"])
    assert "access_token" in ref_res
    assert "refresh_token" in ref_res

    # Old refresh token should be blacklisted
    with pytest.raises(ValueError, match="revoked"):
        refresh_tokens(db, auth_result["refresh_token"])

    # Logout
    assert logout_user(ref_res["access_token"], user.id, db) is True
    assert is_token_blacklisted(ref_res["access_token"]) is True


def test_mfa_login_flow(db):
    email = f"mfa_user_{uuid.uuid4().hex[:6]}@gov.in"
    password = "MfaPassword#123"
    secret = generate_totp_secret()

    user = register_publisher(
        db=db,
        email=email,
        password=password,
        organization_name="Gov Dept",
        organization_domain="gov.in",
    )
    user.mfa_enabled = True
    user.mfa_secret = secret
    db.commit()

    # Initial login requires MFA
    auth_res = authenticate_user(db, email, password)
    assert auth_res["mfa_required"] is True
    assert "mfa_session_token" in auth_res

    # Complete with valid TOTP code
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    mfa_res = verify_mfa_login(db, user.id, valid_code)
    assert "access_token" in mfa_res
    assert mfa_res["mfa_required"] is False

    # Invalid TOTP code fails
    with pytest.raises(ValueError, match="Invalid authentication code"):
        verify_mfa_login(db, user.id, "000000")


def test_user_and_role_management(db):
    email = f"mgmt_user_{uuid.uuid4().hex[:6]}@gov.in"
    user = register_publisher(
        db=db,
        email=email,
        password="Password#123",
        organization_name="Gov Dept",
        organization_domain="gov.in",
    )

    # Fetch user
    fetched = get_user_by_id(db, user.id)
    assert fetched is not None
    assert fetched.email == email

    fetched_email = get_user_by_email(db, email)
    assert fetched_email is not None

    # Update profile
    updated = update_user_profile(db, user.id, {"designation": "Director General"})
    assert updated.designation == "Director General"

    # Permission check (Publisher >= Publisher: True, Publisher >= Admin: False)
    assert check_permission(db, user.id, UserRole.PUBLISHER) is True
    assert check_permission(db, user.id, UserRole.VIEWER) is True
    assert check_permission(db, user.id, UserRole.ADMIN) is False

    # Promote to Admin
    promoted = assign_role(db, user.id, UserRole.ADMIN)
    assert promoted.role == UserRole.ADMIN
    assert check_permission(db, user.id, UserRole.ADMIN) is True

    # Deactivate and Reactivate
    deactivated = deactivate_user(db, user.id, reason="Security audit")
    assert deactivated.is_active is False
    assert check_permission(db, user.id, UserRole.VIEWER) is False

    reactivated = reactivate_user(db, user.id)
    assert reactivated.is_active is True


def test_google_oauth_decision_tree_and_linking(db, monkeypatch):
    """Test the 3-case Google login decision tree and account linking."""
    from app.core.security import create_google_registration_token, verify_google_registration_token
    from app.services.auth_service import authenticate_with_google, link_google_to_user

    google_email_existing_linked = f"linked_{uuid.uuid4().hex[:6]}@pib.gov.in"
    google_id_linked = f"gid_{uuid.uuid4().hex}"
    
    # Pre-create linked user
    user_linked = register_publisher(
        db=db,
        email=google_email_existing_linked,
        password="Password#123",
        organization_name="PIB",
        organization_domain="pib.gov.in",
    )
    user_linked.google_id = google_id_linked
    db.commit()

    # Pre-create unlinked password user (CASE 3)
    unlinked_email = f"unlinked_{uuid.uuid4().hex[:6]}@pib.gov.in"
    user_unlinked = register_publisher(
        db=db,
        email=unlinked_email,
        password="Password#123",
        organization_name="PIB",
        organization_domain="pib.gov.in",
    )
    # google_id remains None

    # Mock Google token exchange & profile fetch
    def mock_exchange_code(code, redirect_uri=None):
        return {"access_token": f"mock_at_{code}"}

    def mock_get_user_info(access_token):
        if access_token == "mock_at_linked":
            return {"sub": google_id_linked, "email": google_email_existing_linked, "name": "Linked User"}
        elif access_token == "mock_at_unlinked":
            return {"sub": f"gid_new_{uuid.uuid4().hex[:6]}", "email": unlinked_email, "name": "Unlinked User"}
        else:
            return {"sub": f"gid_fresh_{uuid.uuid4().hex[:6]}", "email": f"new_{uuid.uuid4().hex[:6]}@pib.gov.in", "name": "New User"}

    monkeypatch.setattr("app.services.auth_service.exchange_code_for_tokens", mock_exchange_code)
    monkeypatch.setattr("app.services.auth_service.get_google_user_info", mock_get_user_info)

    # CASE 1: Existing Google-linked user
    res1 = authenticate_with_google(db, code="linked")
    assert res1["registered"] is True
    assert res1["google_link_required"] is False
    assert "access_token" in res1
    assert res1["user"]["email"] == google_email_existing_linked

    # CASE 3: Existing unlinked password account (must NOT auto-link)
    res3 = authenticate_with_google(db, code="unlinked")
    assert res3["registered"] is True
    assert res3["google_link_required"] is True
    assert "access_token" not in res3 or res3.get("access_token") is None
    assert "Sign in with your password first" in res3["message"]

    # CASE 2: Genuinely new user (receives registration token)
    res2 = authenticate_with_google(db, code="brand_new")
    assert res2["registered"] is False
    assert res2["google_link_required"] is False
    assert "registration_token" in res2
    assert res2["registration_token"] is not None

    # Verify registration token payload
    token_payload = verify_google_registration_token(res2["registration_token"])
    assert token_payload["email"] == res2["email"]
    assert token_payload["google_id"] == token_payload["sub"]

    # Register new user with valid registration token
    new_user = register_publisher(
        db=db,
        email=res2["email"],
        password="NewPassword#123",
        organization_name="New PIB",
        organization_domain="pib.gov.in",
        registration_token=res2["registration_token"],
    )
    assert new_user.google_id == token_payload["google_id"]
    assert new_user.is_verified is False  # Preserves application is_verified semantics

    # Tampering with email during registration fails
    tampered_token = create_google_registration_token("original@pib.gov.in", "gid_123")
    with pytest.raises(ValueError, match="does not match verified Google token"):
        register_publisher(
            db=db,
            email="attacker@pib.gov.in",
            password="Password#123",
            organization_name="PIB",
            organization_domain="pib.gov.in",
            registration_token=tampered_token,
        )

    # Test Authenticated Google Account Linking for user_unlinked
    mock_new_gid = f"gid_for_unlinked_{uuid.uuid4().hex}"
    def mock_get_user_info_link(access_token):
        return {"sub": mock_new_gid, "email": unlinked_email, "name": "Unlinked User"}
    monkeypatch.setattr("app.services.auth_service.get_google_user_info", mock_get_user_info_link)

    # Linking with matching email succeeds
    link_res = link_google_to_user(db, user_unlinked, code="link_code")
    assert link_res["google_id"] == mock_new_gid
    assert user_unlinked.google_id == mock_new_gid

    # Linking with mismatched email fails
    def mock_mismatched_info(access_token):
        return {"sub": "gid_mismatch", "email": "different@pib.gov.in", "name": "Diff"}
    monkeypatch.setattr("app.services.auth_service.get_google_user_info", mock_mismatched_info)

    with pytest.raises(ValueError, match="does not match your authenticated account email"):
        link_google_to_user(db, user_unlinked, code="diff_code")

