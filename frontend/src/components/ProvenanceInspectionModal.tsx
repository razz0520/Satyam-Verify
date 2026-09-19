"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";

interface ProvenanceModalProps {
  item: any | null;
  onClose: () => void;
}

export function ProvenanceInspectionModal({ item, onClose }: ProvenanceModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling and restore smoothly
  useEffect(() => {
    if (!item) return;

    const prevBodyOverflow = document.body.style.overflow;
    const mainContentEls = document.querySelectorAll<HTMLElement>(".main-content");
    const prevMainOverflows = Array.from(mainContentEls).map((el) => el.style.overflowY);

    document.body.style.overflow = "hidden";
    mainContentEls.forEach((el) => {
      el.style.overflowY = "hidden";
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      mainContentEls.forEach((el, i) => {
        el.style.overflowY = prevMainOverflows[i] || "";
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item || !mounted) return null;

  const handleCopyHash = () => {
    if (item.sha256_hash) {
      navigator.clipboard.writeText(item.sha256_hash);
      setCopiedHash(true);
      toast.success("SHA-256 Hash copied to clipboard!");
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const isRevoked = item.status === "REVOKED";

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="provenance-modal-title"
    >
      <div
        className="modal-dialog-card"
        style={{
          maxWidth: "600px",
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "var(--bg-well)",
                display: "grid",
                placeItems: "center",
                color: "var(--green)",
                flexShrink: 0,
              }}
            >
              <ShieldCheck style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Cryptographic Provenance Proof
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                Ed25519 Signed &amp; Ledger-Anchored Record
              </p>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
            style={{ width: "30px", height: "30px" }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-dialog-body">
          {/* File and Status */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "16px",
              background: "var(--bg-well)",
              boxShadow: "var(--well-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                1. Official Asset
              </span>
              <span className={`status ${isRevoked ? "revoked" : ""}`}>
                <i></i> {item.status || "ACTIVE"}
              </span>
            </div>
            <strong style={{ fontSize: "14px", color: "var(--text-primary)", wordBreak: "break-all" }}>
              {item.original_filename}
            </strong>
            <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
              ID: {item.id}
            </span>
          </div>

          {/* SHA-256 Hash with Copy */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "16px",
              background: "var(--bg-well)",
              boxShadow: "var(--well-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                2. SHA-256 Cryptographic Hash
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "var(--green)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedHash ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                {copiedHash ? "Copied" : "Copy"}
              </button>
            </div>
            <div
              className="hash-well current"
              style={{
                userSelect: "all",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
                fontSize: "11px",
                lineHeight: "1.4",
              }}
            >
              {item.sha256_hash}
            </div>
          </div>

          {/* Perceptual / Media Metadata */}
          {item.perceptual_hash && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "16px",
                background: "var(--bg-well)",
                boxShadow: "var(--well-shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                3. Perceptual Robust Fingerprint
              </span>
              <pre
                style={{
                  margin: 0,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "var(--bg-card-solid)",
                  fontFamily: "monospace",
                  fontSize: "10.5px",
                  color: "var(--text-primary)",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {typeof item.perceptual_hash === "object"
                  ? JSON.stringify(item.perceptual_hash, null, 2)
                  : String(item.perceptual_hash)}
              </pre>
            </div>
          )}

          {/* Additional details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div
              style={{
                padding: "12px",
                borderRadius: "14px",
                background: "var(--bg-well)",
                boxShadow: "var(--well-shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Category &amp; Size
              </span>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                {item.content_type} {item.file_size ? `• ${(item.file_size / (1024 * 1024)).toFixed(2)} MB` : ""}
              </strong>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "14px",
                background: "var(--bg-well)",
                boxShadow: "var(--well-shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Registration Date
              </span>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                {item.created_at ? new Date(item.created_at).toLocaleString() : "Confirmed"}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-dialog-footer">
          <button
            className="primary-button"
            style={{ minHeight: "36px", padding: "0 18px", fontSize: "11.5px", fontWeight: 700 }}
            onClick={onClose}
            type="button"
          >
            Close Provenance Proof
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
