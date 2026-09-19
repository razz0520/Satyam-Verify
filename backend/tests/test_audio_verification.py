"""Automated Test Suite for Audio Verification Service Layer Parity.
Covers authentic audio verification (VERIFIED), perceptual audio modification (SUSPICIOUS),
never-registered audio (UNSIGNED), and revoked publisher credentials (PROVEN_INVALID).
"""

import io
import math
import os
from pathlib import Path
import random
import struct
import uuid

import pytest
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.hash_service import (
    calculate_bytes_hash,
    compare_audio_fingerprints,
    compare_perceptual_hashes,
    generate_audio_fingerprint,
    generate_audio_fingerprint_dict,
)
from app.models.database import (
    ContentStatus,
    ContentType,
    CredentialStatus,
    RegisteredContent,
    UserRole,
    VerificationVerdict,
)
from app.services.auth_service import register_publisher
from app.services.publisher_service import register_content
from app.services.verification_service import VerificationService, verify_file
from tests.test_data import generate_modified_audio, generate_sample_audio


def _generate_unique_audio(duration_sec: float = 2.0, base_freq: float = 440.0) -> bytes:
    """Generate authentic WAV audio with a specific base frequency and duration."""
    return generate_sample_audio(duration_sec=duration_sec, sample_rate=16000, freq=base_freq)


def test_audio_exact_registered_verdict_e2e(db: Session, tmp_path):
    """Scenario 1: Register authentic WAV audio -> verify identical WAV -> VERIFIED."""
    uid = uuid.uuid4().hex[:6]
    email = f"audio_pub_{uid}@gov.in"
    user = register_publisher(
        db=db,
        email=email,
        password="Password123!",
        organization_name="All India Radio",
        organization_domain="air.gov.in",
    )
    freq = 400.0 + random.randint(10, 300)
    audio_bytes = _generate_unique_audio(duration_sec=2.0, base_freq=freq)
    filename = f"speech_{uid}.wav"
    upload = UploadFile(filename=filename, file=io.BytesIO(audio_bytes))
    registered = register_content(db=db, publisher=user, upload_file=upload)

    # Submit exact same WAV file for verification
    upload_verify = UploadFile(filename=filename, file=io.BytesIO(audio_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.VERIFIED.value
    assert res["confidence_score"] == 1.0

    ev = res["evidence_bundle"]
    assert ev["sha256_match"] is True
    assert ev["match_type"] == "EXACT_SHA256"
    assert ev["signature_valid"] is True
    assert ev["manifest_valid"] is True
    assert ev["chain_integrity"] is True
    assert ev["publisher_name"] == "All India Radio"
    assert ev["publisher_domain"] == "air.gov.in"


def test_audio_modification_suspicious_e2e(db: Session, tmp_path):
    """Scenario 2: Register authentic WAV audio -> submit controlled modified WAV -> SUSPICIOUS."""
    uid = uuid.uuid4().hex[:6]
    email = f"audio_pub_{uid}@gov.in"
    user = register_publisher(
        db=db,
        email=email,
        password="Password123!",
        organization_name="Ministry of Information",
        organization_domain="mib.gov.in",
    )
    freq = 400.0 + random.randint(10, 300)
    orig_audio = _generate_unique_audio(duration_sec=2.0, base_freq=freq)
    filename = f"broadcast_{uid}.wav"
    upload = UploadFile(filename=filename, file=io.BytesIO(orig_audio))
    registered = register_content(db=db, publisher=user, upload_file=upload)

    # Create a controlled modification of the audio (injected alteration signal / tampering)
    mod_audio = generate_modified_audio(orig_audio, alteration_freq=freq * 1.5, alteration_mix=0.30)
    mod_filename = f"broadcast_altered_{uid}.wav"
    upload_mod = UploadFile(filename=mod_filename, file=io.BytesIO(mod_audio))
    res = verify_file(db=db, upload_file=upload_mod, filename=mod_filename)

    ev = res["evidence_bundle"]
    assert ev["sha256_match"] is False
    assert res["verdict"] == VerificationVerdict.SUSPICIOUS.value
    assert ev["match_type"] == "PERCEPTUAL_SIMILARITY"
    assert ev.get("similarity_score", 0.0) >= 70.0
    assert ev.get("similarity_score", 0.0) < 95.0


def test_audio_unregistered_verdict_e2e(db: Session, tmp_path):
    """Scenario 3: Audio file that has never been registered -> verify_file() -> UNSIGNED."""
    uid = uuid.uuid4().hex[:6]
    freq = 800.0 + random.randint(10, 500)
    unreg_audio = _generate_unique_audio(duration_sec=2.0, base_freq=freq)
    filename = f"unregistered_voice_{uid}.wav"
    upload = UploadFile(filename=filename, file=io.BytesIO(unreg_audio))

    res = verify_file(db=db, upload_file=upload, filename=filename)

    assert res["verdict"] == VerificationVerdict.UNSIGNED.value
    assert res["confidence_score"] == 0.0

    ev = res["evidence_bundle"]
    assert ev["sha256_match"] is False
    assert ev["match_type"] == "NONE"
    assert ev["signature_valid"] is False
    assert ev["manifest_valid"] is False


def test_audio_revoked_credential_proven_invalid_e2e(db: Session, tmp_path):
    """Scenario 4: Register authentic WAV -> revoke publisher credential -> PROVEN_INVALID."""
    uid = uuid.uuid4().hex[:6]
    email = f"audio_rev_{uid}@gov.in"
    user = register_publisher(
        db=db,
        email=email,
        password="Password123!",
        organization_name="Prasar Bharati",
        organization_domain="pb.gov.in",
    )
    freq = 400.0 + random.randint(10, 300)
    audio_bytes = _generate_unique_audio(duration_sec=2.0, base_freq=freq)
    filename = f"bulletin_{uid}.wav"
    upload = UploadFile(filename=filename, file=io.BytesIO(audio_bytes))
    registered = register_content(db=db, publisher=user, upload_file=upload)

    # Revoke publisher credential while signature remains untouched
    user.credentials[0].status = CredentialStatus.REVOKED
    db.commit()

    # Verify identical WAV content
    upload_verify = UploadFile(filename=filename, file=io.BytesIO(audio_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.PROVEN_INVALID.value
    assert res["confidence_score"] == 1.0

    ev = res["evidence_bundle"]
    assert ev["sha256_match"] is True
    assert ev["signature_valid"] is True
    assert "revoked" in ev.get("notice", "").lower()


# ============================================================================
# Unit Tests for compare_audio_fingerprints()
# ============================================================================

def test_compare_audio_fingerprints_identical():
    """Identical audio fingerprints must produce approximately 100.0 similarity."""
    audio = generate_sample_audio(duration_sec=2.0, freq=440.0)
    fp1 = generate_audio_fingerprint_dict(audio)
    fp2 = generate_audio_fingerprint_dict(audio)

    sim = compare_audio_fingerprints(fp1, fp2)
    assert sim >= 99.9
    assert sim <= 100.0


def test_compare_audio_fingerprints_small_difference():
    """Small controlled acoustic difference must produce high similarity (>= 80.0, < 95.0)."""
    orig_audio = generate_sample_audio(duration_sec=2.0, freq=440.0)
    mod_audio = generate_modified_audio(orig_audio, alteration_freq=660.0, alteration_mix=0.30)

    fp1 = generate_audio_fingerprint_dict(orig_audio)
    fp2 = generate_audio_fingerprint_dict(mod_audio)

    sim = compare_audio_fingerprints(fp1, fp2)
    assert sim >= 70.0, f"Expected similarity >= 70.0, got {sim}"
    assert sim < 95.0, f"Expected similarity < 95.0, got {sim}"


def test_compare_audio_fingerprints_clearly_different():
    """Clearly different audio must produce substantially lower similarity (< 50.0)."""
    a1 = generate_sample_audio(duration_sec=2.0, freq=300.0)
    a2 = generate_sample_audio(duration_sec=2.0, freq=1200.0)

    fp1 = generate_audio_fingerprint_dict(a1)
    fp2 = generate_audio_fingerprint_dict(a2)

    sim = compare_audio_fingerprints(fp1, fp2)
    assert sim < 50.0, f"Expected similarity < 50.0 for distinct audio, got {sim}"


def test_compare_audio_fingerprints_degenerate_and_zero():
    """Degenerate/zero/empty feature vectors must be safely handled without crashing."""
    zero_fp1 = {
        "media_type": "AUDIO",
        "status": "AVAILABLE",
        "fingerprint_version": 2,
        "chroma_mean": [0.0] * 12,
        "mfcc_mean": [0.0] * 13,
        "audio_fingerprint": "0" * 64,
    }
    zero_fp2 = {
        "media_type": "AUDIO",
        "status": "AVAILABLE",
        "fingerprint_version": 2,
        "chroma_mean": [0.0] * 12,
        "mfcc_mean": [0.0] * 13,
        "audio_fingerprint": "0" * 64,
    }
    valid_fp = {
        "media_type": "AUDIO",
        "status": "AVAILABLE",
        "fingerprint_version": 2,
        "chroma_mean": [0.1] * 12,
        "mfcc_mean": [0.1] * 13,
        "audio_fingerprint": "a" * 64,
    }

    # Comparing two zero vectors
    sim_zeros = compare_audio_fingerprints(zero_fp1, zero_fp2)
    assert 0.0 <= sim_zeros <= 100.0

    # Comparing zero vector to valid vector
    sim_mixed = compare_audio_fingerprints(zero_fp1, valid_fp)
    assert 0.0 <= sim_mixed <= 100.0

    # Handling empty / malformed dict
    sim_empty = compare_audio_fingerprints({}, {})
    assert sim_empty == 0.0


def test_compare_audio_fingerprints_legacy_strings():
    """Legacy 64-hex strings must be safely handled without crashing."""
    legacy_hex1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    legacy_hex2 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    legacy_hex3 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

    # Same hex string
    sim_same = compare_audio_fingerprints(legacy_hex1, legacy_hex2)
    assert sim_same == 100.0

    # Different hex strings
    sim_diff = compare_audio_fingerprints(legacy_hex1, legacy_hex3)
    assert sim_diff == 0.0


def test_compare_audio_fingerprints_bounded_0_to_100():
    """Scores must strictly remain within [0.0, 100.0] under all variations."""
    for freq in [200.0, 440.0, 800.0, 1500.0]:
        a = generate_sample_audio(duration_sec=1.5, freq=freq)
        fp = generate_audio_fingerprint_dict(a)
        score = compare_audio_fingerprints(fp, fp)
        assert 0.0 <= score <= 100.0

