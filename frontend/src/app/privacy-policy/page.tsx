"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  FileCheck,
  Server,
  MessageSquare,
  Database,
  EyeOff,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/services/authStore";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Last Updated: September 19, 2026 • Satyam Verify / Provenance Systems
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 sm:space-y-10 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1: Introduction */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">1. Introduction</h2>
            </div>
            <p>
              Welcome to <strong>Satyam Verify</strong> (the &ldquo;Platform&rdquo;, operated under Provenance Systems). Satyam Verify is a digital content provenance and verification platform designed to evaluate and verify the authenticity of published digital content, announcements, and media against registered provenance records.
            </p>
            <p>
              This Privacy Policy explains what information may be processed when you interact with our web portal, API endpoints, or WhatsApp verification service, how that information is handled, and our operational practices regarding data handling.
            </p>
          </section>

          {/* Section 2: Information We May Process */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">2. Information We May Process</h2>
            </div>
            <p>Depending on your interaction with the platform, the service may process the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                <strong>Account Information:</strong> Name, organization email address, organization affiliation, and authentication details when authorized publishers register or sign content.
              </li>
              <li>
                <strong>Submitted Verification Content:</strong> Digital media files (such as images, video clips, audio statements, PDF documents, or text statements) submitted through the web verification portal or the WhatsApp verification bot for authenticity checking.
              </li>
              <li>
                <strong>WhatsApp Interaction Metadata:</strong> When interacting via WhatsApp, Meta/WhatsApp transmits technical message metadata (such as sender phone number, message ID, timestamp, and media ID) necessary to process the request and deliver the result back to the user.
              </li>
              <li>
                <strong>Technical Information & Logs:</strong> Operational server logs, request identifiers, HTTP status codes, and rate-limiting counters required to operate, troubleshoot, and secure the service.
              </li>
            </ul>
          </section>

          {/* Section 3: How Content Is Processed */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">3. How Content Is Processed</h2>
            </div>
            <p>When content is submitted for verification, the system processes it to:</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                <strong>Calculate Cryptographic Hashes:</strong> Compute digital fingerprints (such as SHA-256) of the submitted file or text.
              </li>
              <li>
                <strong>Generate Perceptual Fingerprints:</strong> Extract perceptual matching fingerprints (such as perceptual hashes for visual media or acoustic features for audio) where applicable to detect matching content across compression or minor format changes.
              </li>
              <li>
                <strong>Compare Against Registered Provenance Records:</strong> Match calculated identifiers against registered publisher records and digital signature records in the system.
              </li>
              <li>
                <strong>Determine & Provide Verification Result:</strong> Generate a verification verdict and deliver the result and relevant provenance details to the user.
              </li>
            </ol>
          </section>

          {/* Section 4: WhatsApp Verification */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">4. WhatsApp Verification</h2>
            </div>
            <p>
              When a user submits content through the WhatsApp verification service:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                Meta/WhatsApp transmits the incoming message and media payload to the application&apos;s webhook endpoint.
              </li>
              <li>
                The service processes the submitted media or text through the verification pipeline to evaluate provenance.
              </li>
              <li>
                The service sends the resulting verification verdict and response back to the user through WhatsApp.
              </li>
              <li>
                Citizen WhatsApp conversation messages are not permanently stored as conversation logs by the verification bot.
              </li>
            </ul>
          </section>

          {/* Section 5: Storage and Retention */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">5. Storage and Retention</h2>
            </div>
            <p>The platform distinguishes between the categories of data processed by the service:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Publisher Provenance Records</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Registered content metadata, digital signatures, and provenance ledger entries are maintained by the service to enable ongoing verification lookups.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Citizen-Submitted Media</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Media files submitted by citizens for verification are processed temporarily to compute hashes and fingerprints, and temporary working files are cleaned up after verification processing where applicable.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Retention periods depend on the type and purpose of the data and the operational requirements of the service.
            </p>
          </section>

          {/* Section 6: Security */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">6. Security</h2>
            </div>
            <p>
              Satyam Verify implements standard technical security measures to protect the platform and processed data, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                <strong>Encrypted Transport:</strong> Network communications with the web interface and API endpoints utilize encrypted transport (HTTPS/TLS).
              </li>
              <li>
                <strong>Cryptographic Verification:</strong> Provenance assertions rely on cryptographic hashing and digital signatures.
              </li>
              <li>
                <strong>Access Controls & Secret Protection:</strong> System credentials and tokens are managed through access-controlled secrets management and environment isolation.
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please note that while reasonable security practices are maintained, no networked service or data transmission can be guaranteed to be completely secure.
            </p>
          </section>

          {/* Section 7: Third-Party Services */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Server className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">7. Third-Party Services</h2>
            </div>
            <p>
              The platform utilizes third-party infrastructure and service providers to operate:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>
                <strong>Amazon Web Services (AWS):</strong> Cloud infrastructure provider used for hosting backend computing, data storage, and caching services.
              </li>
              <li>
                <strong>Meta WhatsApp Cloud API:</strong> Enterprise messaging service used to transmit incoming verification requests and deliver verification responses over WhatsApp.
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              These providers process data strictly to the extent required to deliver their respective infrastructure or communication services.
            </p>
          </section>

          {/* Section 8: Data Sharing */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <EyeOff className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">8. Data Sharing</h2>
            </div>
            <p>
              Information processed by Satyam Verify is not sold to third parties. Data may be processed by or shared with infrastructure and service providers necessary to operate the platform, or where required to comply with applicable legal obligations.
            </p>
          </section>

          {/* Section 9: User Rights / Requests */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">9. User Rights & Privacy Requests</h2>
            </div>
            <p>
              Users may submit privacy-related questions or requests regarding their account information. To submit a privacy inquiry or request, please contact:
            </p>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                Privacy Contact: <span className="font-semibold text-emerald-600 dark:text-emerald-400">[rahultablet95@gmail.com]</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                (Note: Placeholder contact email — to be confirmed with official project mailbox prior to public launch)
              </p>
            </div>
          </section>

          {/* Section 10: Changes to This Policy */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">10. Changes to This Policy</h2>
            </div>
            <p>
              This Privacy Policy may be updated periodically as the service evolves or operational requirements change. The revised version will be indicated by the &ldquo;Last Updated&rdquo; date at the top of this page.
            </p>
          </section>

          {/* Section 11: Contact */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">11. Contact Information</h2>
            </div>
            <p>
              For privacy, verification, or platform-related inquiries:
            </p>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Platform:</strong> Satyam Verify / Provenance Systems</p>
              <p><strong>Website:</strong> <a href="https://satyamorigin.online" className="text-emerald-600 dark:text-emerald-400 hover:underline">satyamorigin.online</a></p>
              <p><strong>API Endpoint:</strong> <a href="https://api.satyamorigin.online" className="text-emerald-600 dark:text-emerald-400 hover:underline">api.satyamorigin.online</a></p>
              <p><strong>Contact Email:</strong> <span className="font-mono text-emerald-600 dark:text-emerald-400">[rahultablet95@gmail.com]</span> <span className="text-[11px] text-slate-500 italic">(Placeholder)</span></p>
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
              className="text-slate-900 dark:text-white font-semibold underline-offset-4 hover:underline"
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
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
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
