"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Trash2,
  Mail,
  AlertTriangle,
  FileCheck2,
  Database,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/services/authStore";

export default function DataDeletionPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased w-full overflow-x-hidden">
      {/* Top Public Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
            aria-label="Back to Satyam Verify Home"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                SATYAM VERIFY
              </h1>
              <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider truncate">
                Content Provenance & Verification
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Title & Meta */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Official Policy Document</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Data Deletion Instructions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Last Updated: September 19, 2026 • User Privacy &amp; Data Management for Satyam Verify
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 sm:space-y-10 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1: Overview */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">1. User Data Deletion Overview</h2>
            </div>
            <p>
              At <strong>Satyam Verify</strong>, we respect your privacy rights and provide a straightforward procedure for users to request the deletion of personal information associated with their account or use of the platform, including interactions via our website and WhatsApp verification bot.
            </p>
            <p>
              In accordance with Meta Platform policies and general privacy best practices, this page outlines how you can submit a deletion request and how requests are processed by our team.
            </p>
          </section>

          {/* Section 2: How to Submit a Request */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">2. How to Submit a Data Deletion Request</h2>
            </div>
            <p>
              To request deletion of your data, send an email to our official contact mailbox:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                <strong>Recipient:</strong> <span className="text-emerald-600 dark:text-emerald-400">[rahultablet95@gmail.com]</span>
              </div>
              <div className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                <strong>Subject Line:</strong> Data Deletion Request - Satyam Verify
              </div>
            </div>
            <p>Please include the following details in your email body:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>Your full name and organization name (if registered publisher).</li>
              <li>The registered email address or phone number used for WhatsApp verification.</li>
              <li>A brief description of the data or account you wish to have deleted.</li>
            </ul>
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <strong>Security Reminder:</strong> Do NOT include passwords, private signing keys, API tokens, or any other sensitive secrets in your deletion request.
              </div>
            </div>
          </section>

          {/* Section 3: Review and Verification */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">3. Request Processing &amp; Verification</h2>
            </div>
            <p>
              Because Satyam Verify protects high-assurance publisher credentials and verification records, requests undergo identity verification before deletion:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li><strong>Receipt &amp; Acknowledgment:</strong> We acknowledge receipt of your deletion request within a reasonable operational timeframe.</li>
              <li><strong>Identity Verification:</strong> We may send a verification email or confirmation prompt to the registered account to confirm that the requester is the authorized owner.</li>
              <li><strong>Processing:</strong> Upon verification, eligible personal information and associated credentials are systematically deleted or anonymized.</li>
              <li><strong>Confirmation:</strong> A final confirmation will be sent to the requester once the deletion process is completed.</li>
            </ol>
          </section>

          {/* Section 4: Retention Exceptions */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">4. Limitations &amp; Retention Exceptions</h2>
            </div>
            <p>
              While personal identifiers and accounts can be deleted upon request, certain technical data may be retained where strictly necessary for operational, security, or legal integrity:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                <strong>Ephemeral Media:</strong> Files submitted by citizens during WhatsApp or web verification are processed in temporary sandbox memory and are already cleaned up after verification is completed.
              </li>
              <li>
                <strong>Ledger Integrity:</strong> Cryptographic mathematical hash records, digital signature chains, and public provenance blocks already registered on the public registry cannot be retroactively modified or deleted without compromising the cryptographic verification proof of already-verified publications.
              </li>
              <li>
                <strong>Security &amp; Fraud Prevention:</strong> Anonymized audit logs and security telemetry required to investigate abuse, malicious tampering, or platform disruptions may be retained for security monitoring.
              </li>
            </ul>
          </section>

          {/* Section 5: Contact Information */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">5. Contact Information</h2>
            </div>
            <p>
              For any questions regarding data deletion, privacy management, or account status:
            </p>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Platform:</strong> Satyam Verify / Provenance Systems</p>
              <p><strong>Website:</strong> <a href="https://satyamorigin.online" className="text-emerald-600 dark:text-emerald-400 hover:underline">satyamorigin.online</a></p>
              <p><strong>Deletion Inquiries:</strong> <span className="font-mono text-emerald-600 dark:text-emerald-400">[rahultablet95@gmail.com]</span> <span className="text-[11px] text-slate-500 italic">(Placeholder)</span></p>
            </div>
          </section>
        </div>

        {/* Back to Home CTA button */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Verification Portal</span>
          </Link>
        </div>
      </main>

      {/* Reusable Public Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© 2026 National Content Provenance &amp; Verification Authority. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/data-deletion"
              className="text-slate-900 dark:text-white font-semibold underline-offset-4 hover:underline"
            >
              Data Deletion
            </Link>
            <Link
              href="/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Public Registry
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
