"use client";

import React, { useEffect, useState } from "react";
import { useAdminStore } from "@/services/adminStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { stats, integrity, setStats, setIntegrity } = useAdminStore();
  const [loading, setLoading] = useState(!stats);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, integrityRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/registry/integrity").catch(() => api.get("/api/v1/registry/integrity")),
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      if (integrityRes?.data) {
        setIntegrity(integrityRes.data);
      }
    } catch (err) {
      console.error("Failed to load admin stats", err);
      if (!stats) {
        toast.error("Could not retrieve system statistics from backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    toast.success("Hash copied to clipboard!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Extract counts safely from real backend response
  const totalVerifs = stats?.total_verifications ?? 0;
  const verdictMap = stats?.verifications_by_verdict || {};
  const verifiedCount = verdictMap["VERIFIED"] || verdictMap["AUTHENTIC"] || 0;
  const suspiciousCount = verdictMap["SUSPICIOUS"] || 0;
  const unsignedCount = verdictMap["UNSIGNED"] || verdictMap["UNKNOWN"] || 0;
  const invalidCount = verdictMap["PROVEN_INVALID"] || verdictMap["ALTERED"] || 0;

  const verifiedPct = totalVerifs > 0 ? Math.round((verifiedCount / totalVerifs) * 100) : 0;
  const suspiciousPct = totalVerifs > 0 ? Math.round((suspiciousCount / totalVerifs) * 100) : 0;
  const unsignedPct = totalVerifs > 0 ? Math.round((unsignedCount / totalVerifs) * 100) : 0;
  const invalidPct = totalVerifs > 0 ? Math.round((invalidCount / totalVerifs) * 100) : 0;

  // Ledger details from real backend
  const blockHeight = integrity?.total_blocks ?? stats?.total_chain_blocks ?? 0;
  const isChainValid = integrity?.is_valid ?? stats?.chain_integrity_valid ?? true;
  const brokenIndex = integrity?.broken_index;
  const genesisHash = integrity?.genesis_hash || "0000000000000000000000000000000000000000000000000000000000000000";
  const latestHash = integrity?.latest_hash || "-";

  return (
    <section id="view-overview" className="view-pane">
      {/* Page Header */}
      <div className="view-header">
        <div className="view-title">
          <h2>Welcome to Admin Portal</h2>
          <p>National Content Provenance Registry • Global Telemetry &amp; Security Metrics</p>
        </div>
      </div>

      {/* 3 Key Metrics Cards */}
      <div className="stats-clean-grid">
        {/* Authorized Publishers */}
        <div className="stat-clean-card featured-dark">
          <div className="card-top-row">
            <span>Authorized Publishers</span>
          </div>
          <div className="card-bottom-row">
            <span className="card-number">
              {loading && !stats ? "..." : (stats?.total_publishers ?? 0)}
            </span>
            <div className="analytics-capsules">
              <div className="capsule-pill" style={{ height: "24px", background: "rgba(255,255,255,0.25)" }}></div>
              <div className="capsule-pill" style={{ height: "38px", background: "var(--brand-mint)" }}></div>
              <div className="capsule-pill" style={{ height: "48px", background: "#ffffff" }}></div>
            </div>
          </div>
        </div>

        {/* Signed Publications */}
        <div className="stat-clean-card standard-white">
          <div className="card-top-row">
            <span>Signed Publications</span>
          </div>
          <div className="card-bottom-row">
            <span className="card-number">
              {loading && !stats ? "..." : (stats?.total_registered_content ?? 0)}
            </span>
            <div className="analytics-capsules">
              <div className="capsule-pill striped" style={{ height: "22px" }}></div>
              <div className="capsule-pill" style={{ height: "32px", background: "var(--brand-primary)" }}></div>
              <div className="capsule-pill" style={{ height: "46px", background: "var(--brand-mint)" }}></div>
            </div>
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="stat-clean-card standard-white">
          <div className="card-top-row">
            <span>Total Inquiries</span>
          </div>
          <div className="card-bottom-row">
            <span className="card-number">
              {loading && !stats ? "..." : (stats?.total_verifications ?? 0)}
            </span>
            <div className="analytics-capsules">
              <div className="capsule-pill striped" style={{ height: "34px" }}></div>
              <div className="capsule-pill" style={{ height: "42px", background: "var(--brand-dark)" }}></div>
              <div className="capsule-pill" style={{ height: "50px", background: "var(--brand-mint)" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Panels */}
      <div className="lower-clean-grid">
        {/* Verifications by Verdict */}
        <div className="panel-card">
          <div className="panel-title">Verifications by Verdict</div>

          {/* Rounded Capsule Analytics Bar Chart */}
          <div className="analytics-chart-container">
            {/* Verified */}
            <div className="chart-bar-column">
              <div className="bar-bubble-tag" title={`${verifiedCount} verifications`}>
                {verifiedPct}%
              </div>
              <div className="bar-pill-track">
                <div
                  className="bar-pill-fill fill-verified"
                  style={{ height: `${Math.max(12, Math.min(100, verifiedPct))}%` }}
                />
              </div>
              <span className="bar-label-caption">Verified</span>
            </div>

            {/* Suspicious */}
            <div className="chart-bar-column">
              <div className="bar-bubble-tag" title={`${suspiciousCount} suspicious`}>
                {suspiciousPct}%
              </div>
              <div className="bar-pill-track">
                <div
                  className="bar-pill-fill fill-suspicious"
                  style={{ height: `${Math.max(12, Math.min(100, suspiciousPct))}%` }}
                />
              </div>
              <span className="bar-label-caption">Suspicious</span>
            </div>

            {/* Unsigned */}
            <div className="chart-bar-column">
              <div className="bar-bubble-tag" title={`${unsignedCount} unsigned`}>
                {unsignedPct}%
              </div>
              <div className="bar-pill-track">
                <div
                  className="bar-pill-fill fill-unsigned"
                  style={{ height: `${Math.max(12, Math.min(100, unsignedPct))}%` }}
                />
              </div>
              <span className="bar-label-caption">Unsigned</span>
            </div>

            {/* Invalid */}
            <div className="chart-bar-column">
              <div className="bar-bubble-tag" title={`${invalidCount} invalid`}>
                {invalidPct}%
              </div>
              <div className="bar-pill-track">
                <div
                  className="bar-pill-fill fill-invalid"
                  style={{ height: `${Math.max(12, Math.min(100, invalidPct))}%` }}
                />
              </div>
              <span className="bar-label-caption">Invalid</span>
            </div>
          </div>
        </div>

        {/* Hash-Chain Ledger */}
        <div className="ledger-clean-card">
          <div>
            <div className="ledger-header">
              <div style={{ fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                HASH-CHAIN LEDGER (Height: {blockHeight})
              </div>

              {!isChainValid || brokenIndex !== undefined && brokenIndex !== null ? (
                <div className="tamper-badge-pill">
                  <TriangleAlert style={{ width: 14, height: 14 }} />
                  <span>Tampering Detected (#{brokenIndex ?? "?"})</span>
                </div>
              ) : (
                <div className="intact-badge-pill">
                  <ShieldCheck style={{ width: 14, height: 14 }} />
                  <span>Ledger Integrity Intact</span>
                </div>
              )}
            </div>

            <div className="hash-tiles-grid">
              {/* Genesis Anchor */}
              <div className="hash-block-clean">
                <div className="hash-block-header">
                  <span>Genesis Anchor</span>
                  <span style={{ color: "var(--brand-mint)" }}>Root</span>
                </div>
                <div
                  className="hash-text-str"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopy(genesisHash, "genesis")}
                  title="Click to copy full Genesis Hash"
                >
                  {genesisHash.length > 28 ? `${genesisHash.substring(0, 26)}...` : genesisHash}
                  {copiedHash === "genesis" && <Check style={{ width: 12, height: 12, display: "inline", marginLeft: 4, color: "var(--brand-mint)" }} />}
                </div>
              </div>

              {/* Current Head */}
              <div className="hash-block-clean">
                <div className="hash-block-header">
                  <span>Current Head</span>
                  <span style={{ color: isChainValid ? "#86efac" : "#fca5a5" }}>
                    {isChainValid ? "Verified" : "Signed"}
                  </span>
                </div>
                <div
                  className="hash-text-str"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCopy(latestHash, "head")}
                  title="Click to copy full Head Hash"
                >
                  {latestHash.length > 28 ? `${latestHash.substring(0, 26)}...` : latestHash}
                  {copiedHash === "head" && <Check style={{ width: 12, height: 12, display: "inline", marginLeft: 4, color: "var(--brand-mint)" }} />}
                </div>
              </div>
            </div>
          </div>

          <div className="consensus-strip">
            <span style={{ color: "#9cb1a6" }}>Cryptographic Consensus:</span>
            <span style={{ fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand-mint)" }}></span>{" "}
              Ed25519 Verified Proofs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
