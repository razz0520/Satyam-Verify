"use client";

import React, { useEffect, useState } from "react";
import { useAdminStore } from "@/services/adminStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  Search,
  Eye,
  X,
  History,
  Copy,
  Check,
} from "lucide-react";

export default function AdminAuditLogsPage() {
  const { auditLogsList, setAuditLogsList } = useAdminStore();
  const [logs, setLogs] = useState<any[]>(auditLogsList);
  const [loading, setLoading] = useState(auditLogsList.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchLogs = async () => {
    if (logs.length === 0) setLoading(true);
    try {
      let url = "/admin/audit-logs?limit=100";
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await api.get(url);
      const data = res.data || [];
      setLogs(data);
      setAuditLogsList(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load immutable audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    toast.success("Payload JSON copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.actor_id && log.actor_id.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
    );
  });

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case "LOGIN_SUCCESS":
        return <span className="active-badge">{action}</span>;
      case "LOGIN_FAILED":
        return (
          <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
            {action}
          </span>
        );
      case "CONTENT_REGISTER":
        return (
          <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
            {action}
          </span>
        );
      case "CONTENT_REVOKED":
      case "CREDENTIAL_REVOKED":
        return (
          <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
            {action}
          </span>
        );
      default:
        return (
          <span style={{ background: "#f3f5f4", color: "var(--text-main)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>
            {action}
          </span>
        );
    }
  };

  return (
    <section id="view-audit" className="view-pane">
      {/* Page Header */}
      <div className="view-header">
        <div className="view-title">
          <h2>Immutable Audit Trail</h2>
          <p>Tamper-evident log of all publisher registrations, signings, revocations, and system actions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-clean">
        <div className="search-input-clean">
          <Search style={{ width: 16, height: 16, color: "#9aa1a9" }} />
          <input
            type="text"
            placeholder="Search by action or actor ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="select-pill-clean"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Audit Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="CONTENT_REGISTER">CONTENT_REGISTER</option>
          <option value="CONTENT_SUPERSEDED">CONTENT_SUPERSEDED</option>
          <option value="CONTENT_REVOKED">CONTENT_REVOKED</option>
          <option value="CREDENTIAL_CREATED">CREDENTIAL_CREATED</option>
          <option value="CREDENTIAL_REVOKED">CREDENTIAL_REVOKED</option>
          <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
        </select>
      </div>

      {/* Clean Table Container */}
      <div className="table-clean-container">
        <div className="table-scroll-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor ID</th>
                <th>IP Address</th>
                <th>Timestamp</th>
                <th style={{ textAlign: "right" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Loading immutable audit trail from server...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    No audit events found matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{getActionBadge(log.action)}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {log.actor_id ? `${log.actor_id.substring(0, 8)}...` : "System / Anon"}
                    </td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {log.ip_address || "Internal"}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="action-icon-btn"
                        onClick={() => setSelectedLog(log)}
                        title="Inspect Event JSON"
                        type="button"
                      >
                        <Eye style={{ width: 14, height: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Event JSON Inspector Modal */}
      {selectedLog && (
        <div className="admin-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="brand-icon-wrap" style={{ width: 32, height: 32 }}>
                  <History style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h3>Audit Event JSON Inspector</h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    Event: {selectedLog.action}
                  </p>
                </div>
              </div>
              <button
                className="admin-modal-close-btn"
                onClick={() => setSelectedLog(null)}
                type="button"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "10px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Event ID
                  </span>
                  <p style={{ fontFamily: "monospace", fontSize: "11px", marginTop: "2px", wordBreak: "break-all" }}>
                    {selectedLog.id}
                  </p>
                </div>
                <div style={{ padding: "10px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Actor &amp; Origin
                  </span>
                  <p style={{ fontFamily: "monospace", fontSize: "11px", marginTop: "2px" }}>
                    {selectedLog.actor_id ? `${selectedLog.actor_id.substring(0, 10)}...` : "System / Anon"} ({selectedLog.ip_address || "Internal"})
                  </p>
                </div>
              </div>

              <div style={{ padding: "12px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Payload Details
                  </span>
                  <button
                    onClick={() => handleCopyJson(selectedLog.details)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700 }}
                    type="button"
                  >
                    {copiedJson ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                    <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre style={{ fontFamily: "monospace", fontSize: "11.5px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", overflowX: "auto", maxHeight: "240px" }}>
                  {JSON.stringify(selectedLog.details, null, 2) || "{}"}
                </pre>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                className="admin-btn-primary"
                onClick={() => setSelectedLog(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
