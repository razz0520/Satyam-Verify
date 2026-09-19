"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserPlus,
  Key,
  ArrowLeft,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organization_name: "",
    organization_domain: "",
    department: "",
    designation: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        email: formData.email.trim(),
        password: formData.password,
        organization_name: formData.organization_name.trim(),
        organization_domain:
          formData.organization_domain.trim() || formData.email.split("@")[1],
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
      });

      toast.success("Publisher account successfully registered! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const res = await api.get("/auth/google");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error("Failed to initiate Google OAuth.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eceae6] dark:bg-[#0b132b] flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans transition-colors duration-300">
      {/* Outer frame matching static reference with responsive expansion */}
      <div className="relative w-full max-w-[620px] bg-[#e6e4e0] dark:bg-[#121c38] rounded-[36px] sm:rounded-[46px] border border-[#d7d5d0] dark:border-slate-800 p-5 sm:p-9 md:p-11 shadow-[12px_12px_28px_#c7c5c1,-12px_-12px_28px_#ffffff] dark:shadow-[12px_12px_28px_#050914,-12px_-12px_28px_#192646] my-6">
        
        {/* Top Header Row with Floating Back Button and Status Indicator */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            href="/login"
            aria-label="Back to Login"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#e6e4e0] dark:bg-[#162244] flex items-center justify-center shadow-[6px_6px_14px_#c7c5c1,-6px_-6px_14px_#ffffff] dark:shadow-[6px_6px_14px_#060a17,-6px_-6px_14px_#1f305e] border border-white/40 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all text-[#4a4a4a] dark:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6e4e0] dark:bg-[#162244] shadow-[4px_4px_8px_#c7c5c1,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#060a17,-4px_-4px_8px_#1f305e] border border-white/40 dark:border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] sm:text-xs font-semibold text-[#55565a] dark:text-slate-300">
              SatyamVerify Official Portal
            </span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[#3a3b3e] dark:text-white tracking-tight">
            Register Government Publisher
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a7a] dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Provision Ed25519 signing credentials to register authentic official publications
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Row 1: Organization Name & Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Organization Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  placeholder="Press Information Bureau"
                  className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Official Domain *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.organization_domain}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_domain: e.target.value })
                  }
                  placeholder="pib.gov.in"
                  className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Official Email */}
          <div>
            <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
              Official Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="officer@pib.gov.in"
                className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Department <span className="text-[#999] text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="Media & Communications"
                className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Designation <span className="text-[#999] text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                placeholder="Joint Director"
                className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min 8 characters"
                  className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] sm:text-[14px] font-medium text-[#55565a] dark:text-slate-300 mb-1.5 pl-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Re-enter password"
                  className="w-full h-12 sm:h-13 rounded-[26px] bg-[#e6e4e0] dark:bg-[#0d162e] px-5 text-xs sm:text-sm text-[#4a4a4a] dark:text-slate-100 placeholder-[#a7a6a2] dark:placeholder-slate-500 shadow-[inset_4px_4px_8px_#c7c5c1,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#050812,inset_-4px_-4px_8px_#1b2746] border-none outline-none focus:ring-2 focus:ring-[#8a8a8a] dark:focus:ring-navy-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Cryptographic Key Notification Box (Neumorphic Inset Panel) */}
          <div className="p-3.5 sm:p-4 rounded-[22px] bg-[#e6e4e0] dark:bg-[#101a35] shadow-[inset_3px_3px_6px_#c7c5c1,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_#050812,inset_-3px_-3px_6px_#1b2746] text-xs text-[#55565a] dark:text-slate-300 flex items-start gap-3 border border-white/30 dark:border-slate-800">
            <Key className="w-4 h-4 text-[#6e6e6e] dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              An <strong>Ed25519 cryptographic keypair</strong> is provisioned automatically upon registration to cryptographically sign all official publication manifests on the tamper-evident ledger.
            </p>
          </div>

          {/* Terms / Agreement Checkbox Row */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`w-6 h-6 rounded-[7px] flex items-center justify-center transition-all ${
                  agreeTerms
                    ? "bg-[#6e6e6e] dark:bg-navy-700 text-white shadow-[2px_2px_5px_#c7c5c1,-2px_-2px_5px_#ffffff] dark:shadow-[2px_2px_5px_#060a17,-2px_-2px_5px_#1f305e]"
                    : "bg-[#ffffff] dark:bg-slate-800 shadow-[3px_3px_6px_#c7c5c1,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#060a17,-3px_-3px_6px_#1f305e]"
                }`}
              >
                {agreeTerms && (
                  <svg
                    className="w-3.5 h-3.5 stroke-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
              <span className="text-xs sm:text-[13px] text-[#6b6b6b] dark:text-slate-400">
                I agree to the publisher terms & verification protocol
              </span>
            </label>
          </div>

          {/* Submit Sign In / Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 sm:h-14 rounded-[28px] bg-[#6e6e6e] hover:bg-[#585858] dark:bg-navy-800 dark:hover:bg-navy-700 text-white font-medium text-sm sm:text-base shadow-[6px_6px_14px_#c7c5c1,-6px_-6px_14px_#ffffff] dark:shadow-[6px_6px_14px_#050812,-6px_-6px_14px_#192646] hover:shadow-[3px_3px_8px_#c7c5c1,-3px_-3px_8px_#ffffff] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Register Publisher Organization</span>
              </>
            )}
          </button>
        </form>

        {/* Divider Text */}
        <div className="my-6 text-center">
          <span className="text-xs sm:text-sm text-[#8a8a8a] dark:text-slate-500 font-normal">
            or sign up with
          </span>
        </div>

        {/* Social Authentication Button */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={handleGoogleAuth}
            aria-label="Register with Google"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#e6e4e0] dark:bg-[#162244] flex items-center justify-center shadow-[4px_4px_8px_#c9c7c3,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#060a17,-4px_-4px_8px_#1f305e] border border-[#f2f1ee] dark:border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-bold text-lg sm:text-xl text-[#2c2c2c] dark:text-white font-serif">
              G
            </span>
          </button>
        </div>

        {/* Bottom Navigation Row: Sign In link */}
        <div className="text-center pt-2 border-t border-black/5 dark:border-white/5">
          <p className="text-xs sm:text-[13px] text-[#6b6b6b] dark:text-slate-400">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#3a3b3e] dark:text-sky-400 hover:underline ml-1"
            >
              Sign In Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
