"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/services/authStore";
import {
  LayoutDashboard,
  Users,
  Database,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      href: "/admin/users",
      label: "User Directory",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      href: "/admin/content",
      label: "Registry Content",
      icon: Database,
      active: pathname.startsWith("/admin/content"),
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Trail",
      icon: History,
      active: pathname.startsWith("/admin/audit-logs"),
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div>
          {/* Brand Box */}
          <Link
            href="/admin/dashboard"
            className="brand-box"
            onClick={onCloseMobile}
            aria-label="SatyamVerify Admin Dashboard"
          >
            <div
              className="brand-icon-wrap"
              style={{
                width: 82,
                height: 82,
                background: "transparent",
                borderRadius: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/satyam-verify-logo.png"
                alt="SatyamVerify Logo"
                width={82}
                height={82}
                priority
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </Link>

          {/* Nav Group */}
          <div className="nav-group-label">System Governance</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`nav-item ${item.active ? "active" : ""}`}
                    onClick={onCloseMobile}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Thin User Card with Logout */}
        <div className="sidebar-user-thin-card">
          <div className="thin-user-details">
            <strong>{user?.email || "admin@gov.in"}</strong>
            <span>{user?.organization_name || "System Admin"}</span>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            type="button"
            aria-label="Sign Out"
          >
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </aside>
    </>
  );
}
