"use client";

import React, { useEffect, useState } from "react";
import { useAdminStore } from "@/services/adminStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  Search,
  Key,
  Edit2,
  X,
  ShieldCheck,
  PauseCircle,
  Ban,
  Circle,
  Check,
} from "lucide-react";

export default function AdminUsersPage() {
  const { usersList, setUsersList } = useAdminStore();
  const [users, setUsers] = useState<any[]>(usersList);
  const [loading, setLoading] = useState(usersList.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [targetRole, setTargetRole] = useState<string>("PUBLISHER");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Credential Management Modal State
  const [selectedPublisherForCreds, setSelectedPublisherForCreds] = useState<any | null>(null);
  const [userCredentials, setUserCredentials] = useState<any[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);

  const fetchUsers = async () => {
    if (users.length === 0) setLoading(true);
    try {
      let url = "/admin/users?limit=100";
      if (roleFilter) url += `&role=${roleFilter}`;
      const res = await api.get(url);
      const data = res.data || [];
      setUsers(data);
      setUsersList(data);
    } catch (err) {
      console.error("Failed to load users", err);
      toast.error("Could not fetch user directory from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleOpenRoleModal = (u: any) => {
    setEditingUser(u);
    setTargetRole(u.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsUpdatingRole(true);
    try {
      await api.put(`/admin/users/${editingUser.id}/role`, { role: targetRole });
      toast.success(`Role for ${editingUser.email} updated to ${targetRole}.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Failed to update user role.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const fetchPublisherCredentials = async (publisherId: string) => {
    setLoadingCreds(true);
    try {
      const res = await api.get(`/credentials?publisher_id=${publisherId}`);
      setUserCredentials(res.data || []);
    } catch (err) {
      console.error("Failed to load credentials for user", err);
      toast.error("Could not load credentials.");
    } finally {
      setLoadingCreds(false);
    }
  };

  const handleOpenCredsModal = (u: any) => {
    setSelectedPublisherForCreds(u);
    fetchPublisherCredentials(u.id);
  };

  const handleAdminSuspendCredential = async (credId: string) => {
    try {
      await api.put(`/credentials/${credId}/suspend`);
      toast.success("Credential suspended successfully.");
      if (selectedPublisherForCreds) {
        fetchPublisherCredentials(selectedPublisherForCreds.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to suspend credential.");
    }
  };

  const handleAdminRevokeCredential = async (credId: string) => {
    const reason = prompt("Enter administrative revocation reason:");
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) toast.error("Revocation reason must be at least 3 characters.");
      return;
    }
    try {
      await api.put(`/credentials/${credId}/revoke`, { reason: reason.trim() });
      toast.success("Credential revoked successfully.");
      if (selectedPublisherForCreds) {
        fetchPublisherCredentials(selectedPublisherForCreds.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke credential.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.organization_name && u.organization_name.toLowerCase().includes(term)) ||
      (u.organization_domain && u.organization_domain.toLowerCase().includes(term))
    );
  });

  return (
    <section id="view-users" className="view-pane">
      {/* Page Header */}
      <div className="view-header">
        <div className="view-title">
          <h2>User Directory &amp; Access Control</h2>
          <p>Manage authenticated publisher credentials, roles, and administrative privileges</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-clean">
        <div className="search-input-clean">
          <Search style={{ width: 16, height: 16, color: "#9aa1a9" }} />
          <input
            type="text"
            placeholder="Search by email or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="select-pill-clean"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PUBLISHER">Publisher</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {/* Clean Table Container */}
      <div className="table-clean-container">
        <div className="table-scroll-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>User / Email</th>
                <th>Organization</th>
                <th>Domain</th>
                <th>Current Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Loading user directory from server...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleClass =
                    u.role === "ADMIN"
                      ? "role-admin"
                      : u.role === "VIEWER"
                      ? "role-viewer"
                      : "";

                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.email}</strong>
                      </td>
                      <td>{u.organization_name || "-"}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {u.organization_domain || "-"}
                      </td>
                      <td>
                        <span className={`role-badge ${roleClass}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.is_active !== false ? (
                          <span className="active-badge">
                            <Circle style={{ width: 6, height: 6, fill: "currentColor" }} /> Active
                          </span>
                        ) : (
                          <span className="revoked-badge">
                            <Circle style={{ width: 6, height: 6, fill: "currentColor" }} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {u.role === "PUBLISHER" && (
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenCredsModal(u)}
                            title="Manage Publisher Signing Credentials"
                            type="button"
                          >
                            <Key style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                        <button
                          className="action-icon-btn"
                          onClick={() => handleOpenRoleModal(u)}
                          title="Change User Role"
                          type="button"
                        >
                          <Edit2 style={{ width: 14, height: 14 }} />
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

      {/* Role Management Modal */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Change User Role</h3>
              <button
                className="admin-modal-close-btn"
                onClick={() => setEditingUser(null)}
                type="button"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 700 }}>
                  User Account
                </span>
                <p style={{ fontWeight: 800, marginTop: "4px", fontSize: "14px" }}>
                  {editingUser.email}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  {editingUser.organization_name} ({editingUser.organization_domain})
                </p>
              </div>

              <div>
                <label
                  htmlFor="role-select"
                  style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}
                >
                  Assign Role
                </label>
                <select
                  id="role-select"
                  className="select-pill-clean"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "12px" }}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="ADMIN">ADMIN — Full system administration &amp; governance</option>
                  <option value="PUBLISHER">PUBLISHER — Authorize and sign official government content</option>
                  <option value="VIEWER">VIEWER — Read-only verification access</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                className="admin-btn-secondary"
                onClick={() => setEditingUser(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleSaveRole}
                disabled={isUpdatingRole}
                type="button"
              >
                {isUpdatingRole ? "Saving..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publisher Credential Management Modal */}
      {selectedPublisherForCreds && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPublisherForCreds(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="brand-icon-wrap" style={{ width: 32, height: 32 }}>
                  <Key style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h3>Publisher Signing Credentials</h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {selectedPublisherForCreds.organization_name} ({selectedPublisherForCreds.email})
                  </p>
                </div>
              </div>
              <button
                className="admin-modal-close-btn"
                onClick={() => setSelectedPublisherForCreds(null)}
                type="button"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {loadingCreds ? (
                <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  Loading cryptographic certificates from server...
                </div>
              ) : userCredentials.length === 0 ? (
                <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  No credentials issued for this publisher on record.
                </div>
              ) : (
                userCredentials.map((cred) => {
                  const isRevoked = cred.status === "REVOKED";
                  const validFrom = cred.valid_from ? new Date(cred.valid_from).toLocaleDateString() : "-";
                  const validUntil = cred.valid_until ? new Date(cred.valid_until).toLocaleDateString() : "-";

                  return (
                    <div
                      key={cred.id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid var(--border-subtle)",
                        background: "#fafbfb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700 }}>
                            {cred.id.length > 18 ? `${cred.id.substring(0, 14)}...` : cred.id}
                          </span>
                          <span className={isRevoked ? "revoked-badge" : "active-badge"}>
                            {cred.status}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            {cred.credential_type}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Valid: {validFrom} &rarr; {validUntil}
                        </div>
                        {cred.revocation_reason && (
                          <div style={{ fontSize: "11px", color: "var(--status-red)", fontWeight: 600 }}>
                            Reason: {cred.revocation_reason}
                          </div>
                        )}
                      </div>

                      {cred.status === "ACTIVE" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleAdminSuspendCredential(cred.id)}
                            className="admin-btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            type="button"
                          >
                            <PauseCircle style={{ width: 13, height: 13 }} />
                            <span>Suspend</span>
                          </button>
                          <button
                            onClick={() => handleAdminRevokeCredential(cred.id)}
                            className="admin-btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "11px", color: "#b91c1c", borderColor: "#fca5a5", background: "#fee2e2", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            type="button"
                          >
                            <Ban style={{ width: 13, height: 13 }} />
                            <span>Revoke</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                className="admin-btn-primary"
                onClick={() => setSelectedPublisherForCreds(null)}
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
