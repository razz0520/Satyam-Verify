"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/services/authStore";
import { usePublisherStore } from "@/services/publisherStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Key, Copy, Check, X, ShieldCheck } from "lucide-react";

function CredentialsContent() {
  const { user, updateUser } = useAuthStore();
  const searchParams = useSearchParams();
  const { credentialsList, setCredentialsList } = usePublisherStore();
  const [credentials, setCredentials] = useState<any[]>(credentialsList);
  const [loading, setLoading] = useState(credentialsList.length === 0);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [validDays, setValidDays] = useState(365);
  const [isIssuing, setIsIssuing] = useState(false);
  const [copiedPem, setCopiedPem] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Google OAuth callback code for account linking
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google account linking was cancelled or failed.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (code && processedCodeRef.current !== code) {
      processedCodeRef.current = code;
      setIsLinking(true);

      const linkAccount = async () => {
        try {
          const redirect_uri = `${window.location.origin}/dashboard/credentials`;
          const res = await api.post("/auth/google/link", {
            code,
            redirect_uri,
          });

          const updatedGoogleId = res.data?.data?.google_id || res.data?.data?.user?.google_id;
          const updatedGoogleEmail = res.data?.data?.email || res.data?.data?.user?.google_email;

          updateUser({
            google_id: updatedGoogleId,
            google_email: updatedGoogleEmail,
          });

          toast.success(res.data?.message || "Google account linked successfully!");
        } catch (err: any) {
          console.error("Link Google error:", err);
          const errorDetail = err.response?.data?.detail || err.response?.data?.message || "";
          if (errorDetail.toLowerCase().includes("does not match")) {
            toast.error("That Google account does not match the email address on your Satyam Verify account.");
          } else if (errorDetail.toLowerCase().includes("already linked")) {
            toast.error("This Google account is already linked to another Satyam Verify account.");
          } else {
            toast.error(errorDetail || "Failed to link Google account.");
          }
        } finally {
          setIsLinking(false);
          window.history.replaceState({}, "", window.location.pathname);
        }
      };

      linkAccount();
    }
  }, [searchParams, updateUser]);

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

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const redirect_uri = `${window.location.origin}/dashboard/credentials`;
      const res = await api.get("/auth/google", {
        params: { redirect_uri },
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Failed to initialize Google authentication.");
        setIsLinking(false);
      }
    } catch (err: any) {
      console.error("Initiate Google link error:", err);
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Failed to initiate Google OAuth.");
      setIsLinking(false);
    }
  };

  const orgName = user?.organization_name || "Press Information Bureau";
  const orgDomain = user?.organization_domain || "gov.in";
  const isGoogleLinked = Boolean(user?.google_id);
  const linkedGoogleEmail = user?.google_email || (isGoogleLinked ? user?.email : null);

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

      {/* Google Account Linking Card */}
      <div className="content-card panel" style={{ marginTop: "24px" }}>
        <div className="section-heading">
          <div className="section-title">
            <div className="section-icon" style={{ background: "var(--bg-well)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h2>Google Account</h2>
              <p>
                Status:{" "}
                {isGoogleLinked ? (
                  <strong style={{ color: "var(--green, #087052)" }}>Linked</strong>
                ) : (
                  <strong style={{ color: "var(--text-secondary)" }}>Not linked</strong>
                )}
                {isGoogleLinked && linkedGoogleEmail && (
                  <span> &bull; {linkedGoogleEmail}</span>
                )}
              </p>
            </div>
          </div>

          <div>
            {isGoogleLinked ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  background: "rgba(8, 112, 82, 0.08)",
                  color: "var(--green, #087052)",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid rgba(8, 112, 82, 0.2)",
                }}
              >
                <Check style={{ width: 14, height: 14 }} />
                <span>Connected</span>
              </div>
            ) : (
              <button
                className="primary-button"
                style={{ minHeight: "38px", padding: "0 18px", fontSize: "11px" }}
                onClick={handleLinkGoogle}
                disabled={isLinking}
                type="button"
                id="link-google-btn"
              >
                {isLinking ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Link Google Account</span>
                )}
              </button>
            )}
          </div>
        </div>

        <div style={{ paddingTop: "14px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          {isGoogleLinked ? (
            <p style={{ margin: 0 }}>
              Your Google identity is securely linked to this publisher profile. You can sign in using either your password or Google Single Sign-On.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Link your verified Google account ({user?.email ? <strong>{user.email}</strong> : "matching your registered email"}) to enable one-click Google Sign-In alongside password authentication.
            </p>
          )}
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

export default function CredentialsKeysPage() {
  return (
    <Suspense
      fallback={
        <section id="view-credentials" className="tab-page active-view">
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            Loading credentials...
          </div>
        </section>
      }
    >
      <CredentialsContent />
    </Suspense>
  );
}
