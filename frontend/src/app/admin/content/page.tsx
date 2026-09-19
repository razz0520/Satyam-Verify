"use client";

import React, { useEffect, useState } from "react";
import { useAdminStore } from "@/services/adminStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  Search,
  Eye,
  X,
  Copy,
  Check,
  Circle,
  FileCode,
  ShieldCheck,
} from "lucide-react";

export default function AdminContentPage() {
  const { contentList, setContentList } = useAdminStore();
  const [items, setItems] = useState<any[]>(contentList);
  const [loading, setLoading] = useState(contentList.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchContent = async () => {
    if (items.length === 0) setLoading(true);
    try {
      let url = "/content?limit=100";
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      const list = res.data.items || [];
      setItems(list);
      setContentList(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load registry master content ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [statusFilter]);

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    toast.success("SHA-256 Hash copied to clipboard!");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.original_filename && item.original_filename.toLowerCase().includes(term)) ||
      (item.sha256_hash && item.sha256_hash.toLowerCase().includes(term)) ||
      (item.publisher_id && item.publisher_id.toLowerCase().includes(term))
    );
  });

  const getTypeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return { color: "#4338ca", fontWeight: 800 };
      case "AUDIO":
        return { color: "var(--brand-primary)", fontWeight: 800 };
      case "TEXT":
        return { color: "#b45309", fontWeight: 800 };
      case "IMAGE":
        return { color: "#b91c1c", fontWeight: 800 };
      default:
        return { color: "var(--text-main)", fontWeight: 800 };
    }
  };

  return (
    <section id="view-registry" className="view-pane">
      {/* Page Header */}
      <div className="view-header">
        <div className="view-title">
          <h2>Registry Master Content Ledger</h2>
          <p>Global repository of signed official publications across all government publishers</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-clean">
        <div className="search-input-clean">
          <Search style={{ width: 16, height: 16, color: "#9aa1a9" }} />
          <input
            type="text"
            placeholder="Search by filename or SHA-256 hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="select-pill-clean"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUPERSEDED">Superseded</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {/* Clean Table Container */}
      <div className="table-clean-container">
        <div className="table-scroll-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Publisher ID</th>
                <th>Type</th>
                <th>SHA-256 Hash</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Loading registry content from server...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    No registered content records found matching query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isRevoked = item.status === "REVOKED";
                  const isSuperseded = item.status === "SUPERSEDED";

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.original_filename}</strong>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {item.publisher_id ? `${item.publisher_id.substring(0, 8)}...` : "-"}
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", ...getTypeStyle(item.content_type) }}>
                          {item.content_type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {item.sha256_hash ? `${item.sha256_hash.substring(0, 16)}...` : "-"}
                      </td>
                      <td>
                        {isRevoked ? (
                          <span className="revoked-badge">
                            <Circle style={{ width: 6, height: 6, fill: "currentColor" }} /> REVOKED
                          </span>
                        ) : isSuperseded ? (
                          <span className="role-badge" style={{ background: "#fef3c7", color: "#b45309" }}>
                            SUPERSEDED
                          </span>
                        ) : (
                          <span className="active-badge">
                            <Circle style={{ width: 6, height: 6, fill: "currentColor" }} /> ACTIVE
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="action-icon-btn"
                          onClick={() => setSelectedItem(item)}
                          title="Inspect Ledger Manifest & Hashes"
                          type="button"
                        >
                          <Eye style={{ width: 14, height: 14 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Manifest Inspector Modal */}
      {selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="brand-icon-wrap" style={{ width: 32, height: 32 }}>
                  <ShieldCheck style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h3>Ledger Manifest Inspector</h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {selectedItem.original_filename}
                  </p>
                </div>
              </div>
              <button
                className="admin-modal-close-btn"
                onClick={() => setSelectedItem(null)}
                type="button"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Content Record ID
                </span>
                <p style={{ fontFamily: "monospace", fontWeight: 700, marginTop: "2px", wordBreak: "break-all" }}>
                  {selectedItem.id}
                </p>
              </div>

              <div style={{ padding: "12px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    SHA-256 Cryptographic Hash
                  </span>
                  <button
                    onClick={() => handleCopyHash(selectedItem.sha256_hash)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700 }}
                    type="button"
                  >
                    {copiedHash ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                    <span>{copiedHash ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p style={{ fontFamily: "monospace", fontWeight: 600, marginTop: "4px", wordBreak: "break-all", color: "var(--brand-dark)" }}>
                  {selectedItem.sha256_hash}
                </p>
              </div>

              <div style={{ padding: "12px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Perceptual Hash Embeddings
                </span>
                <pre style={{ fontFamily: "monospace", fontSize: "11px", background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginTop: "4px", overflowX: "auto" }}>
                  {JSON.stringify(selectedItem.perceptual_hash, null, 2) || "None"}
                </pre>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "10px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Publisher ID
                  </span>
                  <p style={{ fontFamily: "monospace", fontSize: "11px", marginTop: "2px" }}>
                    {selectedItem.publisher_id || "-"}
                  </p>
                </div>
                <div style={{ padding: "10px", borderRadius: "12px", background: "#f8faf9", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    File Size &amp; MIME
                  </span>
                  <p style={{ fontSize: "11px", marginTop: "2px", fontWeight: 600 }}>
                    {selectedItem.file_size ? `${(selectedItem.file_size / 1024).toFixed(1)} KB` : "-"} • {selectedItem.mime_type || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                className="admin-btn-primary"
                onClick={() => setSelectedItem(null)}
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
