"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/services/authStore";
import { usePublisherStore } from "@/services/publisherStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Key, Copy, Check, X, ShieldCheck } from "lucide-react";

export default function CredentialsKeysPage() {
  const { user } = useAuthStore();
  const { credentialsList, setCredentialsList } = usePublisherStore();
  const [credentials, setCredentials] = useState<any[]>(credentialsList);
  const [loading, setLoading] = useState(credentialsList.length === 0);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [validDays, setValidDays] = useState(365);
  const [isIssuing, setIsIssuing] = useState(false);
  const [copiedPem, setCopiedPem] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when issue modal is open
  useEffect(() => {
    if (!showIssueModal) return;

    const prevBodyOverflow = document.body.style.overflow;
    const mainContentEls = document.querySelectorAll<HTMLElement>(".main-content");
    const prevMainOverflows = Array.from(mainContentEls).map((el) => el.style.overflowY);

    document.body.style.overflow = "hidden";
    mainContentEls.forEach((el) => {
      el.style.overflowY = "hidden";
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIssueModal(false);
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
  }, [showIssueModal]);

  const fetchCredentials = async () => {
    if (credentials.length === 0) setLoading(true);
    try {
      const res = await api.get("/credentials");
      const list = res.data || [];
      setCredentials(list);
      setCredentialsList(list);
    } catch (err) {
      console.error("Failed to fetch credentials", err);
      toast.error("Failed to load credentials from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleCopyPem = () => {
    const pem = user?.public_key || "";
    if (pem) {
      navigator.clipboard.writeText(pem);
      setCopiedPem(true);
      toast.success("Ed25519 Public Key PEM copied to clipboard!");
      setTimeout(() => setCopiedPem(false), 2000);
    } else {
      toast.error("No public key available to copy.");
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    try {
      await api.post("/credentials", {
        credential_type: "SECONDARY",
        valid_days: Number(validDays),
      });
      toast.success("Secondary credential issued successfully!");
      setShowIssueModal(false);
      fetchCredentials();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Failed to issue credential.");
    } finally {
      setIsIssuing(false);
    }
  };

  const orgName = user?.organization_name || "Press Information Bureau";
  const orgDomain = user?.organization_domain || "gov.in";

  return (
    <section id="view-credentials" className="tab-page active-view">
      <header className="page-header">
        <h1>Cryptographic Credentials &amp; Keys</h1>
        <button
          className="primary-button"
          onClick={() => setShowIssueModal(true)}
          type="button"
          id="issue-secondary-cred-btn"
        >
          <span>Issue Secondary Credential</span>
        </button>
      </header>

      {/* Primary Key Card */}
      <div className="content-card panel">
        <div className="section-heading">
          <div className="section-title">
            <div className="section-icon">
              <Key style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2>Ed25519 Public Certificate Key</h2>
              <p>
                Bound to: <b>{orgName} ({orgDomain})</b>
              </p>
            </div>
          </div>
          <button
            className="primary-button"
            style={{ minHeight: "38px", padding: "0 16px", fontSize: "10px" }}
            onClick={handleCopyPem}
            type="button"
            id="copy-pem-btn"
          >
            {copiedPem ? (
              <>
                <Check style={{ width: 13, height: 13 }} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy style={{ width: 13, height: 13 }} />
                <span>Copy PEM</span>
              </>
            )}
          </button>
        </div>

        <div style={{ paddingTop: "18px" }}>
          <div className="code-well">
            {user?.public_key ||
`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAWO7jfwZBegwrzyS7wx71jLg16eTkCw3LMKU1V1J2Hec=
-----END PUBLIC KEY-----`}
          </div>
        </div>
      </div>

      {/* Historical Credentials Card */}
      <div className="historical-credentials-card panel">
        <div className="historical-header-title">Active &amp; Historical Credentials</div>
        <div className="historical-divider" />

        {loading ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
            Loading cryptographic certificates...
          </div>
        ) : credentials.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
            No credentials found on record.
          </div>
        ) : (
          credentials.map((cred) => {
            const isRevoked = cred.status === "REVOKED";
            const validFrom = cred.valid_from ? new Date(cred.valid_from).toLocaleDateString() : "-";
            const validUntil = cred.valid_until ? new Date(cred.valid_until).toLocaleDateString() : "-";

            return (
              <div key={cred.id} className="credential-item-row">
                <div className="credential-left">
                  <div className="credential-key-box">
                    <Key style={{ width: 19, height: 19 }} />
                  </div>
                  <div className="credential-details-copy">
                    <span className="credential-id-text">{cred.id}</span>
                    <div className="credential-meta-inline">
                      <span className="cred-primary-badge">
                        {cred.credential_type || "PRIMARY"}
                      </span>
                      <span className="cred-date-span">
                        Valid: {validFrom} &rarr; {validUntil}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`status ${isRevoked ? "revoked" : ""}`}>
                  <i></i> {cred.status || "ACTIVE"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Issue Secondary Credential Modal */}
      {showIssueModal &&
        mounted &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowIssueModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="issue-modal-title"
          >
            <div
              className="modal-dialog-card"
              style={{
                maxWidth: "460px",
                padding: "24px 26px",
                gap: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Key style={{ width: 20, height: 20, color: "var(--green)" }} />
                  <h3 id="issue-modal-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Issue Secondary Credential
                  </h3>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setShowIssueModal(false)}
                  aria-label="Close modal"
                  type="button"
                  style={{ width: "30px", height: "30px" }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Provision an Ed25519 signing certificate bound to{" "}
                <strong style={{ color: "var(--text-primary)" }}>{orgName}</strong> for departmental publication workflows.
              </p>

              <form onSubmit={handleIssueSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Validity Duration (Days) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={1825}
                    required
                    className="custom-field"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    autoFocus
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="primary-button"
                    style={{
                      background: "var(--bg-well)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--well-shadow)",
                      minHeight: "36px",
                      padding: "0 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIssuing}
                    className="primary-button"
                    style={{
                      minHeight: "36px",
                      padding: "0 18px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {isIssuing ? "Issuing..." : "Issue Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
