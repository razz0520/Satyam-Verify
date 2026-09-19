"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/services/authStore";
import { AdminSidebar } from "@/components/AdminSidebar";
import "@/styles/admin.css";
import Image from "next/image";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5f4]">
        <div className="w-8 h-8 border-4 border-[#0d3829] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image
              src="/satyam-verify-logo.png"
              alt="SatyamVerify Admin Logo"
              width={34}
              height={34}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>
            SatyamVerify Admin
          </strong>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          aria-label="Toggle navigation"
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>
      </div>

      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="main-viewport">
        {children}
      </main>
    </div>
  );
}
