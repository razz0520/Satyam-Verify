import io
from pathlib import Path
import random
import uuid

from fastapi import UploadFile
import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.hash_service import (
    add_block,
    create_genesis_block,
    detect_tampering,
    get_chain_state,
    verify_chain,
)
from app.models.database import (
    ContentStatus,
    ContentType,
    CredentialStatus,
    HashChainEntry,
    RegisteredContent,
    VerificationVerdict,
)
from app.services.auth_service import register_publisher
from app.services.publisher_service import register_content
from app.services.verification_service import verify_file
from tests.test_data import (
    generate_sample_audio,
    generate_sample_image,
    generate_sample_pdf,
)


def _create_test_publisher(db: Session, prefix: str = "ledger"):
    uid = uuid.uuid4().hex[:6]
    return register_publisher(
        db=db,
        email=f"{prefix}_{uid}@meity.gov.in",
        password="Password123!",
        organization_name="Ministry of Electronics & IT",
        organization_domain="meity.gov.in",
    )


def test_valid_hash_chain_verification(db: Session):
    """1. Create sequential genuine chain and verify that verify_chain() returns True."""
    publisher = _create_test_publisher(db, "valid_chain")
    u1 = uuid.uuid4().hex
    img_bytes = generate_sample_image(f"GENUINE CHAIN TEST 1 {u1}")
    upload = UploadFile(filename=f"chain_doc1_{u1[:6]}.png", file=io.BytesIO(img_bytes))
    c1 = register_content(db=db, publisher=publisher, upload_file=upload)

    u2 = uuid.uuid4().hex
    img_bytes2 = generate_sample_image(f"GENUINE CHAIN TEST 2 {u2}")
    upload2 = UploadFile(filename=f"chain_doc2_{u2[:6]}.png", file=io.BytesIO(img_bytes2))
    c2 = register_content(db=db, publisher=publisher, upload_file=upload2)

    is_valid, broken_id = verify_chain(db)
    assert is_valid is True
    assert broken_id is None
    assert detect_tampering(db) is False

    state = get_chain_state(db)
    assert state["is_valid"] is True
    assert state["total_blocks"] >= 2


def test_intermediate_prev_hash_tampering(db: Session):
    """2. Mutating prev_hash of an intermediate block must be detected by verify_chain()."""
    publisher = _create_test_publisher(db, "tamper_prev")
    for i in range(3):
        u = uuid.uuid4().hex
        upload = UploadFile(filename=f"prev_tamper_{u[:6]}.png", file=io.BytesIO(generate_sample_image(f"INTERMEDIATE {i} {u}")))
        register_content(db=db, publisher=publisher, upload_file=upload)

    entries = db.execute(select(HashChainEntry).order_by(HashChainEntry.id.asc())).scalars().all()
    assert len(entries) >= 3

    target_entry = entries[-2]  # Intermediate block
    orig_prev = target_entry.prev_hash

    try:
        target_entry.prev_hash = "deadbeef" * 8
        db.commit()

        is_valid, broken_id = verify_chain(db)
        assert is_valid is False
        assert broken_id == target_entry.id
        assert detect_tampering(db) is True
    finally:
        target_entry.prev_hash = orig_prev
        db.commit()


def test_intermediate_current_hash_tampering(db: Session):
    """3. Mutating current_hash of an intermediate block must be detected by verify_chain()."""
    publisher = _create_test_publisher(db, "tamper_curr")
    for i in range(3):
        u = uuid.uuid4().hex
        upload = UploadFile(filename=f"curr_tamper_{u[:6]}.png", file=io.BytesIO(generate_sample_image(f"CURR TAMPER {i} {u}")))
        register_content(db=db, publisher=publisher, upload_file=upload)

    entries = db.execute(select(HashChainEntry).order_by(HashChainEntry.id.asc())).scalars().all()
    assert len(entries) >= 3

    target_entry = entries[-2]  # Intermediate block
    orig_curr = target_entry.current_hash

    try:
        target_entry.current_hash = "f" * 64
        db.commit()

        is_valid, broken_id = verify_chain(db)
        assert is_valid is False
        assert broken_id is not None
        assert detect_tampering(db) is True
    finally:
        target_entry.current_hash = orig_curr
        db.commit()


def test_head_current_hash_tampering(db: Session):
    """4. Mutating current_hash of the LATEST (head) block must be detected via intra-block recalculation."""
    publisher = _create_test_publisher(db, "tamper_head")
    u = uuid.uuid4().hex
    upload = UploadFile(filename=f"head_doc_{u[:6]}.png", file=io.BytesIO(generate_sample_image(f"HEAD BLOCK TEST {u}")))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)

    latest_entry = db.execute(select(HashChainEntry).order_by(HashChainEntry.id.desc()).limit(1)).scalar_one()
    orig_head_hash = latest_entry.current_hash

    try:
        # Tamper exclusively with the head block's current_hash
        latest_entry.current_hash = "e" * 64
        db.commit()

        is_valid, broken_id = verify_chain(db)
        assert is_valid is False, "Head block current_hash tampering was not detected by verify_chain()"
        assert broken_id == latest_entry.id
        assert detect_tampering(db) is True
    finally:
        latest_entry.current_hash = orig_head_hash
        db.commit()


def test_hash_chain_metadata_tampering(db: Session):
    """5. Tampering with registered content metadata (SHA-256) invalidates intra-block calculation."""
    publisher = _create_test_publisher(db, "tamper_meta")
    u = uuid.uuid4().hex
    upload = UploadFile(filename=f"meta_doc_{u[:6]}.png", file=io.BytesIO(generate_sample_image(f"METADATA PAYLOAD TEST {u}")))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)

    orig_sha = registered.sha256_hash
    entry = registered.hash_chain_entry

    try:
        # Mutate the bound content hash
        registered.sha256_hash = "0" * 64
        db.commit()

        is_valid, broken_id = verify_chain(db)
        assert is_valid is False, "Content hash tampering was not detected by intra-block chain verification"
        assert broken_id == entry.id
    finally:
        registered.sha256_hash = orig_sha
        db.commit()


def test_service_layer_ledger_tampering_prevents_verified(db: Session):
    """6. Service-layer verification MUST return PROVEN_INVALID when ledger is tampered despite valid signature."""
    publisher = _create_test_publisher(db, "service_tamper")
    u = uuid.uuid4().hex
    img_bytes = generate_sample_image(f"SERVICE LAYER LEDGER TAMPER TEST {u}")
    filename = f"ledger_tamper_verify_{u[:6]}.png"
    upload = UploadFile(filename=filename, file=io.BytesIO(img_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)

    # Validate baseline genuine verification succeeds
    upload_verify = UploadFile(filename=filename, file=io.BytesIO(img_bytes))
    res_before = verify_file(db=db, upload_file=upload_verify, filename=filename)
    assert res_before["verdict"] == VerificationVerdict.VERIFIED.value
    assert res_before["evidence_bundle"]["chain_integrity"] is True

    # Tamper with the ledger block while signature and credential remain ACTIVE
    entry = registered.hash_chain_entry
    orig_prev = entry.prev_hash
    try:
        entry.prev_hash = "deadbeef" * 8
        db.commit()

        # Re-verify the identical authentic file
        upload_verify_tampered = UploadFile(filename=filename, file=io.BytesIO(img_bytes))
        res_after = verify_file(db=db, upload_file=upload_verify_tampered, filename=filename)

        ev = res_after["evidence_bundle"]
        assert ev["chain_integrity"] is False, "chain_integrity must be False when ledger is tampered"
        assert res_after["verdict"] != VerificationVerdict.VERIFIED.value, "Broken ledger must NEVER award VERIFIED"
        assert res_after["verdict"] == VerificationVerdict.PROVEN_INVALID.value
        assert "ledger" in ev.get("notice", "").lower()
    finally:
        entry.prev_hash = orig_prev
        db.commit()


def test_missing_hash_chain_entry_prevents_verified(db: Session):
    """7. Content missing a HashChainEntry anchor MUST NOT produce VERIFIED verdict."""
    publisher = _create_test_publisher(db, "missing_entry")
    u = uuid.uuid4().hex
    img_bytes = generate_sample_image(f"MISSING ENTRY TEST {u}")
    filename = f"missing_entry_verify_{u[:6]}.png"
    upload = UploadFile(filename=filename, file=io.BytesIO(img_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)

    # Delete the content's HashChainEntry
    entry = registered.hash_chain_entry
    db.delete(entry)
    db.commit()

    upload_verify = UploadFile(filename=filename, file=io.BytesIO(img_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    ev = res["evidence_bundle"]
    assert ev["chain_integrity"] is False
    assert ev["chain_block_id"] is None
    assert res["verdict"] != VerificationVerdict.VERIFIED.value
    assert res["verdict"] == VerificationVerdict.PROVEN_INVALID.value


def test_content_type_parity_chain_integrity_image_e2e(db: Session):
    """8A. Genuine Image registration produces chain_integrity == True."""
    publisher = _create_test_publisher(db, "parity_img")
    u = uuid.uuid4().hex
    media_bytes = generate_sample_image(f"PARITY IMAGE {u}")
    filename = f"parity_ledger_{u[:6]}.png"

    upload = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)
    assert registered.hash_chain_entry is not None

    upload_verify = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.VERIFIED.value
    ev = res["evidence_bundle"]
    assert ev["chain_integrity"] is True
    assert ev["chain_block_id"] == registered.hash_chain_entry.id


def test_content_type_parity_chain_integrity_audio_e2e(db: Session):
    """8B. Genuine Audio registration produces chain_integrity == True."""
    publisher = _create_test_publisher(db, "parity_aud")
    u = uuid.uuid4().hex
    freq = 400.0 + random.randint(10, 400)
    media_bytes = generate_sample_audio(duration_sec=1.5, freq=freq)
    filename = f"parity_ledger_{u[:6]}.wav"

    upload = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)
    assert registered.hash_chain_entry is not None

    upload_verify = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.VERIFIED.value
    ev = res["evidence_bundle"]
    assert ev["chain_integrity"] is True
    assert ev["chain_block_id"] == registered.hash_chain_entry.id


def test_content_type_parity_chain_integrity_pdf_e2e(db: Session):
    """8C. Genuine PDF registration produces chain_integrity == True."""
    publisher = _create_test_publisher(db, "parity_pdf")
    u = uuid.uuid4().hex
    media_bytes = generate_sample_pdf(f"Parity Gazette Order 2026 Ref {u}")
    filename = f"parity_ledger_{u[:6]}.pdf"

    upload = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)
    assert registered.hash_chain_entry is not None

    upload_verify = UploadFile(filename=filename, file=io.BytesIO(media_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.VERIFIED.value
    ev = res["evidence_bundle"]
    assert ev["chain_integrity"] is True
    assert ev["chain_block_id"] == registered.hash_chain_entry.id


def test_content_type_parity_chain_integrity_video_e2e(db: Session, tmp_path):
    """8D. Genuine Video registration produces chain_integrity == True."""
    import cv2
    import numpy as np

    publisher = _create_test_publisher(db, "parity_vid")
    uid = uuid.uuid4().hex[:6]
    video_path = str(tmp_path / f"parity_video_{uid}.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(video_path, fourcc, 10.0, (120, 120))
    for i in range(15):
        frame = np.zeros((120, 120, 3), dtype=np.uint8)
        cv2.circle(frame, (20 + i * 3, 50), 15, (100, 180, 240), -1)
        out.write(frame)
    out.release()

    with open(video_path, "rb") as f:
        video_bytes = f.read()

    filename = f"parity_ledger_{uid}.mp4"
    upload = UploadFile(filename=filename, file=io.BytesIO(video_bytes))
    registered = register_content(db=db, publisher=publisher, upload_file=upload)
    assert registered.hash_chain_entry is not None

    upload_verify = UploadFile(filename=filename, file=io.BytesIO(video_bytes))
    res = verify_file(db=db, upload_file=upload_verify, filename=filename)

    assert res["verdict"] == VerificationVerdict.VERIFIED.value
    ev = res["evidence_bundle"]
    assert ev["chain_integrity"] is True
    assert ev["chain_block_id"] == registered.hash_chain_entry.id


# ============================================================================
# Candidate-Scoped Hash-Chain Verification & Historical Broken Block Isolation
# ============================================================================

def test_unrelated_historical_broken_block_candidate_remains_verified(db: Session):
    """
    Test that an unrelated historical corrupted block (e.g. Block #43 in dev db)
    does NOT cause an otherwise authentic candidate to receive PROVEN_INVALID.
    Global verify_chain() must still detect the historical corruption.
    """
    publisher = _create_test_publisher(db, "iso_valid")
    
    # 1. Register historical content #1 (which will be tampered)
    u1 = uuid.uuid4().hex
    img1 = generate_sample_image(f"HISTORICAL ITEM 1 {u1}")
    fn1 = f"hist_{u1[:6]}.png"
    reg1 = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn1, file=io.BytesIO(img1)))
    b1_id = reg1.hash_chain_entry.id

    # 2. Register candidate content #2 (genuine and healthy)
    u2 = uuid.uuid4().hex
    img2 = generate_sample_image(f"GENUINE CANDIDATE 2 {u2}")
    fn2 = f"cand_{u2[:6]}.png"
    reg2 = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn2, file=io.BytesIO(img2)))
    b2_id = reg2.hash_chain_entry.id

    # 3. Simulate historical block corruption on #1 (tamper its manifest signature)
    orig_sig = reg1.manifest.digital_signature
    try:
        reg1.manifest.digital_signature = "TAMPERED_SIG_12345"
        db.commit()

        # 4. Global verify_chain() MUST detect the tampering on block #1
        is_chain_valid, broken_block_id = verify_chain(db)
        assert is_chain_valid is False
        assert broken_block_id == b1_id

        # 5. Candidate content #2 verification MUST succeed as VERIFIED
        verify_upload = UploadFile(filename=fn2, file=io.BytesIO(img2))
        res2 = verify_file(db=db, upload_file=verify_upload, filename=fn2)

        assert res2["verdict"] == VerificationVerdict.VERIFIED.value
        assert res2["confidence_score"] == 1.0
        ev2 = res2["evidence_bundle"]
        assert ev2["chain_integrity"] is True
        assert ev2["chain_block_id"] == b2_id
        assert ev2["signature_valid"] is True
    finally:
        reg1.manifest.digital_signature = orig_sig
        db.commit()


def test_candidate_block_current_hash_tampered_produces_proven_invalid(db: Session):
    """Tampering candidate's own current_hash produces PROVEN_INVALID."""
    publisher = _create_test_publisher(db, "tamper_cand_curr")
    u = uuid.uuid4().hex
    img = generate_sample_image(f"CAND CURR TAMPER {u}")
    fn = f"cand_curr_{u[:6]}.png"
    reg = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn, file=io.BytesIO(img)))

    # Tamper candidate block's current_hash
    b = reg.hash_chain_entry
    orig_hash = b.current_hash
    try:
        b.current_hash = "beef" * 16
        db.commit()

        verify_upload = UploadFile(filename=fn, file=io.BytesIO(img))
        res = verify_file(db=db, upload_file=verify_upload, filename=fn)

        assert res["verdict"] == VerificationVerdict.PROVEN_INVALID.value
        assert res["evidence_bundle"]["chain_integrity"] is False
        assert "Provenance ledger integrity check failed" in res["evidence_bundle"]["notice"]
    finally:
        b.current_hash = orig_hash
        db.commit()


def test_candidate_block_prev_hash_tampered_produces_proven_invalid(db: Session):
    """Tampering candidate block's prev_hash linkage produces PROVEN_INVALID."""
    publisher = _create_test_publisher(db, "tamper_cand_prev")
    
    # Block 1
    u1 = uuid.uuid4().hex
    register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=f"b1_{u1[:6]}.png", file=io.BytesIO(generate_sample_image(f"B1 {u1}"))))
    
    # Block 2 (Candidate)
    u2 = uuid.uuid4().hex
    img2 = generate_sample_image(f"B2 {u2}")
    fn2 = f"b2_{u2[:6]}.png"
    reg2 = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn2, file=io.BytesIO(img2)))

    # Tamper candidate block's prev_hash
    orig_prev = reg2.hash_chain_entry.prev_hash
    try:
        reg2.hash_chain_entry.prev_hash = "dead" * 16
        db.commit()

        verify_upload = UploadFile(filename=fn2, file=io.BytesIO(img2))
        res = verify_file(db=db, upload_file=verify_upload, filename=fn2)

        assert res["verdict"] == VerificationVerdict.PROVEN_INVALID.value
        assert res["evidence_bundle"]["chain_integrity"] is False
    finally:
        reg2.hash_chain_entry.prev_hash = orig_prev
        db.commit()


def test_missing_candidate_hash_chain_entry_produces_proven_invalid(db: Session):
    """If a registered content record is missing its HashChainEntry, it is PROVEN_INVALID."""
    publisher = _create_test_publisher(db, "missing_chain")
    u = uuid.uuid4().hex
    img = generate_sample_image(f"MISSING CHAIN {u}")
    fn = f"missing_{u[:6]}.png"
    reg = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn, file=io.BytesIO(img)))

    # Delete candidate's hash chain entry
    db.delete(reg.hash_chain_entry)
    db.commit()

    verify_upload = UploadFile(filename=fn, file=io.BytesIO(img))
    res = verify_file(db=db, upload_file=verify_upload, filename=fn)

    assert res["verdict"] == VerificationVerdict.PROVEN_INVALID.value
    assert res["evidence_bundle"]["chain_integrity"] is False


def test_revocation_verdict_semantics_and_re_registration(db: Session):
    """
    Test that:
    1. Revoked candidate produces PROVEN_INVALID for revocation reason (not ledger error).
    2. Re-registering the same exact content creates a new valid block without corrupting the historical block.
    """
    publisher = _create_test_publisher(db, "re_register")
    u = uuid.uuid4().hex
    img_bytes = generate_sample_image(f"RE REGISTRATION CONTENT {u}")
    fn = f"official_release_{u[:6]}.png"

    # 1. Initial registration
    reg1 = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn, file=io.BytesIO(img_bytes)))
    b1_id = reg1.hash_chain_entry.id
    b1_hash = reg1.hash_chain_entry.current_hash

    # 2. Revoke initial registration
    reg1.status = ContentStatus.REVOKED
    db.commit()

    # Verify revoked content
    res_revoked = verify_file(db=db, upload_file=UploadFile(filename=fn, file=io.BytesIO(img_bytes)), filename=fn)
    assert res_revoked["verdict"] == VerificationVerdict.PROVEN_INVALID.value
    assert "revoked" in res_revoked["evidence_bundle"]["notice"].lower()

    # 3. Re-register same content legitimately
    reg2 = register_content(db=db, publisher=publisher, upload_file=UploadFile(filename=fn, file=io.BytesIO(img_bytes)))
    b2_id = reg2.hash_chain_entry.id
    b2_hash = reg2.hash_chain_entry.current_hash

    assert b2_id > b1_id
    assert reg2.hash_chain_entry.prev_hash == b1_hash
    assert reg1.status == ContentStatus.REVOKED
    assert reg2.status == ContentStatus.ACTIVE

    # 4. Verify newly re-registered content
    res_new = verify_file(db=db, upload_file=UploadFile(filename=fn, file=io.BytesIO(img_bytes)), filename=fn)
    assert res_new["verdict"] == VerificationVerdict.VERIFIED.value
    assert res_new["evidence_bundle"]["chain_integrity"] is True
    assert res_new["evidence_bundle"]["chain_block_id"] == b2_id
    assert res_new["matched_content"]["id"] == str(reg2.id)

    # 5. Both blocks and the full ledger remain healthy
    is_valid, broken_id = verify_chain(db)
    assert is_valid is True
    assert broken_id is None

