"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/services/api";
import { usePublisherStore } from "@/services/publisherStore";
import { toast } from "sonner";
import {
  Film,
  Music,
  Image as ImageIcon,
  FileText,
  Type,
  ShieldOff,
  Eye,
  ChevronDown,
  AlertTriangle,
  X,
} from "lucide-react";
import { ProvenanceInspectionModal } from "@/components/ProvenanceInspectionModal";

export default function PublicationsRegistryPage() {
  const { publicationsList, setPublicationsList } = usePublisherStore();
  const [contentList, setContentList] = useState<any[]>(publicationsList);
  const [loading, setLoading] = useState(publicationsList.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mounted, setMounted] = useState(false);

  // Modals
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [revokeItem, setRevokeItem] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when revoke modal is open
  useEffect(() => {
    if (!revokeItem) return;

    const prevBodyOverflow = document.body.style.overflow;
    const mainContentEls = document.querySelectorAll<HTMLElement>(".main-content");
    const prevMainOverflows = Array.from(mainContentEls).map((el) => el.style.overflowY);

    document.body.style.overflow = "hidden";
    mainContentEls.forEach((el) => {
      el.style.overflowY = "hidden";
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRevokeItem(null);
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
  }, [revokeItem]);

  const fetchContent = async () => {
    if (contentList.length === 0) setLoading(true);
    try {
      let url = "/content?limit=50";
      if (typeFilter) url += `&content_type=${typeFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      const items = res.data.items || [];
      setContentList(items);
      setPublicationsList(items);
    } catch (err) {
      console.error("Failed to load publications", err);
      if (contentList.length === 0) toast.error("Failed to load publications from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [typeFilter, statusFilter]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeItem || !revokeReason.trim()) {
      toast.error("Please enter a revocation reason.");
      return;
    }

    setIsRevoking(true);
    try {
      await api.put(`/content/${revokeItem.id}/revoke`, {
        reason: revokeReason.trim(),
      });
      toast.success(`Revoked official authenticity for "${revokeItem.original_filename}".`);
      setRevokeItem(null);
      setRevokeReason("");
      fetchContent();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Revocation failed.");
    } finally {
      setIsRevoking(false);
    }
  };

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

  const filteredItems = contentList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.original_filename && item.original_filename.toLowerCase().includes(term)) ||
      (item.sha256_hash && item.sha256_hash.toLowerCase().includes(term))
    );
  });

  return (
    <section id="view-publications" className="tab-page active-view">
      <header className="page-header">
        <h1>Publications Registry</h1>
      </header>

      <div className="content-card panel">
        {/* Filter Toolbar */}
        <div className="filter-toolbar-custom">
          <input
            type="text"
            className="custom-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by filename or SHA-256 hash..."
          />

          <div className="select-wrapper">
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Content Types</option>
              <option value="VIDEO">Video Broadcast</option>
              <option value="AUDIO">Audio Speech</option>
              <option value="PDF">Gazette / PDF</option>
              <option value="IMAGE">Image</option>
              <option value="TEXT">Press Release</option>
            </select>
            <ChevronDown className="select-arrow" />
          </div>

          <div className="select-wrapper">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
              <option value="SUPERSEDED">Superseded</option>
            </select>
            <ChevronDown className="select-arrow" />
          </div>
        </div>

        {/* Publication List */}
        <div className="publication-list">
          {loading ? (
            <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              Querying registered publication records...
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
              No publications found matching your search and filter criteria.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isRevoked = item.status === "REVOKED";
              const shortHash = item.sha256_hash
                ? `${item.sha256_hash.substring(0, 8)}...${item.sha256_hash.substring(item.sha256_hash.length - 3)}`
                : "None";
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString()
                : "Live";

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

                    {!isRevoked && (
                      <button
                        className="action-revoke-btn"
                        title="Revoke Publication"
                        aria-label="Revoke Publication"
                        onClick={() => setRevokeItem(item)}
                        type="button"
                      >
                        <ShieldOff style={{ width: 14, height: 14 }} />
                      </button>
                    )}

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
      </div>

      {/* Provenance Inspection Modal */}
      {inspectItem && (
        <ProvenanceInspectionModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* Revocation Confirmation Modal */}
      {revokeItem &&
        mounted &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setRevokeItem(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-modal-title"
          >
            <div
              className="modal-dialog-card"
              style={{
                maxWidth: "440px",
                padding: "22px 24px",
                gap: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ef4444" }}>
                  <ShieldOff style={{ width: 20, height: 20 }} />
                  <div>
                    <h3 id="revoke-modal-title" style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Revoke Official Content
                    </h3>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                      {revokeItem.original_filename}
                    </span>
                  </div>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setRevokeItem(null)}
                  aria-label="Close modal"
                  type="button"
                  style={{ width: "30px", height: "30px" }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <form onSubmit={handleRevokeSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="input-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="input-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Revocation Reason <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className="custom-field"
                    required
                    rows={2}
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Enter reason..."
                    style={{ minHeight: "68px", resize: "none", fontSize: "12px", padding: "10px 14px", borderRadius: "12px" }}
                    autoFocus
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "2px" }}>
                  <button
                    type="button"
                    onClick={() => setRevokeItem(null)}
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
                    disabled={isRevoking}
                    className="primary-button"
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      minHeight: "36px",
                      padding: "0 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {isRevoking ? "Revoking..." : "Confirm Revocation"}
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
