"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { usePublisherStore } from "@/services/publisherStore";
import {
  FileText,
  CheckCircle,
  Users,
  Layers,
  ShieldCheck,
  Film,
  Music,
  Image as ImageIcon,
  Type,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { ProvenanceInspectionModal } from "@/components/ProvenanceInspectionModal";

export default function DashboardOverviewPage() {
  const { overviewStats, ledgerIntegrity, recentPublications, setOverviewData } = usePublisherStore();
  const [stats, setStats] = useState<any>(overviewStats);
  const [integrity, setIntegrity] = useState<any>(ledgerIntegrity);
  const [recentContent, setRecentContent] = useState<any[]>(recentPublications);
  const [loading, setLoading] = useState(!overviewStats);
  const [error, setError] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  const loadOverviewData = async () => {
    if (!overviewStats && !stats) setLoading(true);
    setError(null);
    try {
      const [statusRes, integrityRes, contentRes] = await Promise.all([
        api.get("/status").catch(() => ({ data: null })),
        api.get("/registry/integrity").catch(() => ({ data: null })),
        api.get("/content?limit=5").catch(() => ({ data: { items: [] } })),
      ]);

      const freshStats = statusRes.data || stats;
      const freshIntegrity = integrityRes.data || integrity;
      const freshContent = contentRes.data?.items || recentContent;

      setStats(freshStats);
      setIntegrity(freshIntegrity);
      setRecentContent(freshContent);
      setOverviewData(freshStats, freshIntegrity, freshContent);
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      if (!stats) setError("Failed to load live server data. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  const getMediaIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return <Film style={{ width: 19, height: 19 }} />;
      case "AUDIO":
        return <Music style={{ width: 19, height: 19 }} />;
      case "IMAGE":
        return <ImageIcon style={{ width: 19, height: 19 }} />;
      case "TEXT":
        return <Type style={{ width: 19, height: 19 }} />;
      default:
        return <FileText style={{ width: 19, height: 19 }} />;
    }
  };

  return (
    <section id="view-overview" className="tab-page active-view">
      {/* Page Header */}
      <header className="page-header">
        <h1>Welcome to SatyamVerify Publisher Portal</h1>
      </header>

      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={loadOverviewData}
            className="primary-button"
            style={{ marginLeft: "auto", minHeight: "32px", padding: "0 12px", fontSize: "11px" }}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3 Top Statistics Cards */}
      <section className="stats-grid">
        {/* Total Publications */}
        <article className="stat-card panel">
          <div className="stat-head">
            <span>Total Publications</span>
            <div className="stat-icon">
              <FileText style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <strong>{stats ? stats.total_registered_content : (loading ? "..." : 0)}</strong>
          <p className="success-copy">
            <i></i>Live in immutable registry
          </p>
        </article>

        {/* Ledger Verifications */}
        <article className="stat-card emerald-card">
          <div className="stat-head">
            <span>Ledger Verifications</span>
            <div className="stat-icon">
              <CheckCircle style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <strong>{stats ? stats.total_verifications : (loading ? "..." : 0)}</strong>
          <p>96.5% Citizen inquiries served</p>
        </article>

        {/* Active Publishers */}
        <article className="stat-card panel">
          <div className="stat-head">
            <span>Active Publishers</span>
            <div className="stat-icon">
              <Users style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <strong>{stats ? stats.active_publishers : (loading ? "..." : 1)}</strong>
          <p>Authorized government agencies</p>
        </article>
      </section>

      {/* Hash-Chain Ledger Anchor */}
      <section className="content-card panel">
        <div className="section-heading">
          <div className="section-title">
            <div className="section-icon">
              <Layers style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2>Hash-Chain Ledger Anchor</h2>
              <p>
                Ledger Height:{" "}
                <b>
                  {integrity
                    ? `${integrity.total_blocks} Entries`
                    : stats
                    ? `${stats.total_registered_content} Entries`
                    : (loading ? "..." : "0 Entries")}
                </b>
              </p>
            </div>
          </div>
          <span className="verified-pill">
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span>
              {integrity?.is_valid !== false ? "Integrity Verified" : "Audit Alert"}
            </span>
          </span>
        </div>

        <div className="anchor-grid">
          <div className="anchor-box">
            <div className="anchor-label">
              <span>Genesis Anchor</span>
              <b>ROOT CONSTANT</b>
            </div>
            <div className="hash-well">
              {integrity?.genesis_hash ||
                "0000000000000000000000000000000000000000000000000000000000000000"}
            </div>
          </div>
          <div className="anchor-box">
            <div className="anchor-label">
              <span>Current Ledger Head</span>
              <b className="latest">LATEST SIGNED</b>
            </div>
            <div className="hash-well current">
              {integrity?.latest_hash || (loading && !stats ? "..." : "No transactions recorded yet")}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Official Publications */}
      <section className="content-card panel">
        <div className="section-heading">
          <div className="section-title">
            <div className="section-icon">
              <FileText style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2>Recent Official Publications</h2>
            </div>
          </div>
          <Link
            href="/dashboard/content"
            className="primary-button"
            style={{ minHeight: "38px", padding: "0 16px", fontSize: "10px" }}
          >
            View All
          </Link>
        </div>

        <div className="publication-list">
          {loading && recentContent.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              Retrieving cryptographic publication records...
            </div>
          ) : recentContent.length === 0 ? (
            <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              No publications registered yet. Use the{" "}
              <Link href="/dashboard/register-content" style={{ color: "var(--green)", fontWeight: 700 }}>
                Register Content
              </Link>{" "}
              workflow to anchor your first official asset.
            </div>
          ) : (
            recentContent.map((item) => {
              const isRevoked = item.status === "REVOKED";
              const shortHash = item.sha256_hash
                ? `${item.sha256_hash.substring(0, 8)}...${item.sha256_hash.substring(item.sha256_hash.length - 3)}`
                : "None";
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString()
                : "Confirmed";

              return (
                <div key={item.id} className="publication-row">
                  <div className="publication-main">
                    <div className="file-icon">{getMediaIcon(item.content_type)}</div>
                    <div className="publication-copy">
                      <p
                        style={
                          isRevoked
                            ? { textDecoration: "line-through", color: "var(--text-secondary)" }
                            : undefined
                        }
                      >
                        {item.original_filename}
                      </p>
                      <div className="publication-meta">
                        <span className="type-tag">{item.content_type || "MEDIA"}</span>
                        <span className="hash">{shortHash}</span>
                        <span className="hash">{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="publication-actions">
                    <span className={`status ${isRevoked ? "revoked" : ""}`}>
                      <i></i> {item.status || "ACTIVE"}
                    </span>
                    <button
                      className="action-eye-btn"
                      title="Inspect Hash Proof"
                      onClick={() => setInspectItem(item)}
                      type="button"
                      aria-label="Inspect Proof"
                    >
                      <Eye style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Provenance Inspection Modal */}
      {inspectItem && (
        <ProvenanceInspectionModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}
    </section>
  );
}
