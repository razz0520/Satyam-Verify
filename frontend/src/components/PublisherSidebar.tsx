"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/services/authStore";
import {
  LayoutGrid,
  PlusCircle,
  Folder,
  Key,
  Scan,
  ArrowUpRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";

export function PublisherSidebar() {
  const pathname = usePathname();
  const { user, logout, theme, toggleTheme } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const orgName = user?.organization_name || "Press Info Bureau";
  const email = user?.email || "publisher@gov.in";

  // Compute 2-3 letter initials for avatar
  const initials = orgName
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase() || "GOV";

  const isOverview = pathname === "/dashboard";
  const isRegister = pathname === "/dashboard/register-content";
  const isPublications = pathname === "/dashboard/content";
  const isCredentials = pathname === "/dashboard/credentials";

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* =========================================================================
          1. MOBILE TOP-RIGHT FLOATING/FIXED HAMBURGER BUTTON (Mobile/Tablet <= 1024px)
          ========================================================================= */}
      <button
        className="mobile-hamburger-btn panel"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        type="button"
        id="mobile-nav-toggle"
      >
        {mobileMenuOpen ? (
          <X style={{ width: 20, height: 20 }} />
        ) : (
          <Menu style={{ width: 20, height: 20 }} />
        )}
      </button>

      {/* =========================================================================
          2. MOBILE NAVIGATION DRAWER & BACKDROP (Mobile/Tablet <= 1024px)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Publisher Portal Navigation"
      >
        <div className="mobile-drawer-card panel">
          {/* Drawer Header */}
          <div className="mobile-drawer-header">
            <Link
              href="/dashboard"
              className="mobile-drawer-brand"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="SatyamVerify Publisher Portal"
            >
              <div className="drawer-logo-wrap">
                <Image
                  src="/satyam-verify-logo.png"
                  alt="SatyamVerify logo"
                  width={34}
                  height={34}
                  priority
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div className="drawer-brand-text">
                <strong>SatyamVerify</strong>
                <span>Publisher Portal</span>
              </div>
            </Link>
            <button
              className="icon-button drawer-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              type="button"
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="mobile-drawer-body">
            <div className="nav-section">
              <p>Publisher Workspace</p>

              <Link
                href="/dashboard"
                prefetch={true}
                className={`nav-item ${isOverview ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutGrid style={{ width: 18, height: 18 }} />
                <span>Overview</span>
              </Link>

              <Link
                href="/dashboard/register-content"
                prefetch={true}
                className={`nav-item ${isRegister ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusCircle style={{ width: 18, height: 18 }} />
                <span>Register Content</span>
              </Link>

              <Link
                href="/dashboard/content"
                prefetch={true}
                className={`nav-item ${isPublications ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Folder style={{ width: 18, height: 18 }} />
                <span>My Publications</span>
              </Link>

              <Link
                href="/dashboard/credentials"
                prefetch={true}
                className={`nav-item ${isCredentials ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Key style={{ width: 18, height: 18 }} />
                <span>Credentials &amp; Keys</span>
              </Link>
            </div>

            <div className="nav-section citizen">
              <p>Citizen Tools</p>
              <Link
                href="/"
                prefetch={true}
                className="nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-with-icon">
                  <Scan style={{ width: 18, height: 18 }} />
                  <span>Public Verifier</span>
                </span>
                <ArrowUpRight style={{ marginLeft: "auto", width: 15, height: 15 }} />
              </Link>
            </div>
          </div>

          {/* Drawer Account / Actions Footer */}
          <div className="mobile-drawer-footer">
            <div className="avatar" title={orgName}>
              {initials}
            </div>
            <div className="account-copy">
              <strong title={orgName}>{orgName}</strong>
              <span title={email}>{email}</span>
            </div>
            <div className="drawer-actions-cluster">
              <button
                className="icon-button"
                title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                type="button"
              >
                {theme === "light" ? (
                  <Moon style={{ width: 16, height: 16 }} />
                ) : (
                  <Sun style={{ width: 16, height: 16 }} />
                )}
              </button>
              <button
                className="icon-button"
                title="Log Out"
                onClick={logout}
                aria-label="Log Out"
                type="button"
              >
                <LogOut style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MOBILE FIXED BOTTOM IDENTITY BAR (Mobile/Tablet <= 1024px)
          ========================================================================= */}
      <footer className="mobile-bottom-bar panel" aria-label="Mobile Footer Identity">
        <div className="bottom-bar-left">
          <div className="bottom-logo-icon">
            <Image
              src="/satyam-verify-logo.png"
              alt="SatyamVerify logo"
              width={20}
              height={20}
              priority
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div className="bottom-brand-text">
            <strong>SatyamVerify</strong>
            <span>Immutable Provenance</span>
          </div>
        </div>
        <div className="bottom-bar-right">
          <span className="bottom-publisher-tag" title={orgName}>
            {orgName.length > 20 ? `${orgName.slice(0, 18)}...` : orgName}
          </span>
        </div>
      </footer>

      {/* =========================================================================
          4. DESKTOP PINNED SIDEBAR (Desktop >= 1025px only)
          ========================================================================= */}
      <aside className="sidebar desktop-sidebar">
        {/* Brand Header */}
        <div className="brand-card panel">
          <Link href="/dashboard" className="brand-mark" aria-label="SatyamVerify logo">
            <Image
              src="/satyam-verify-logo.png"
              alt="SatyamVerify logo"
              width={78}
              height={78}
              priority
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="nav-card panel">
          <div className="nav-section">
            <p>Publisher Workspace</p>

            <Link
              href="/dashboard"
              prefetch={true}
              className={`nav-item ${isOverview ? "active" : ""}`}
              id="nav-overview-btn"
            >
              <LayoutGrid style={{ width: 18, height: 18 }} />
              <span>Overview</span>
            </Link>

            <Link
              href="/dashboard/register-content"
              prefetch={true}
              className={`nav-item ${isRegister ? "active" : ""}`}
              id="nav-register-btn"
            >
              <PlusCircle style={{ width: 18, height: 18 }} />
              <span>Register Content</span>
            </Link>

            <Link
              href="/dashboard/content"
              prefetch={true}
              className={`nav-item ${isPublications ? "active" : ""}`}
              id="nav-publications-btn"
            >
              <Folder style={{ width: 18, height: 18 }} />
              <span>My Publications</span>
            </Link>

            <Link
              href="/dashboard/credentials"
              prefetch={true}
              className={`nav-item ${isCredentials ? "active" : ""}`}
              id="nav-credentials-btn"
            >
              <Key style={{ width: 18, height: 18 }} />
              <span>Credentials &amp; Keys</span>
            </Link>
          </div>

          <div className="nav-section citizen">
            <p>Citizen Tools</p>
            <Link href="/" prefetch={true} className="nav-item" id="nav-public-verifier-btn">
              <span className="nav-with-icon">
                <Scan style={{ width: 18, height: 18 }} />
                <span>Public Verifier</span>
              </span>
              <ArrowUpRight style={{ marginLeft: "auto", width: 15, height: 15 }} />
            </Link>
          </div>
        </div>

        {/* Account Info */}
        <div className="account-card panel">
          <div className="avatar" title={orgName}>
            {initials}
          </div>
          <div className="account-copy">
            <strong title={orgName}>{orgName}</strong>
            <span title={email}>{email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", flexShrink: 0 }}>
            <button
              className="icon-button"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === "light" ? (
                <Moon style={{ width: 16, height: 16 }} />
              ) : (
                <Sun style={{ width: 16, height: 16 }} />
              )}
            </button>
            <button
              className="icon-button"
              title="Log Out"
              onClick={logout}
              aria-label="Log Out"
              type="button"
              id="logout-button"
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
