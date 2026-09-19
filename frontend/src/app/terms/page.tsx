"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Scale,
  Cpu,
  Server,
  RefreshCw,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import { useAuthStore } from "@/services/authStore";

export default function TermsOfServicePage() {
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
            Terms of Service
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
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">1. Introduction</h2>
            </div>
            <p>
              Welcome to <strong>Satyam Verify</strong> (&ldquo;the Platform&rdquo;, developed under Provenance Systems). Satyam Verify provides a cryptographically anchored digital content provenance and verification service designed to help users determine whether published media or statements correspond to verified publisher origins.
            </p>
            <p>
              By accessing or using our website, API, or automated WhatsApp verification service, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          {/* Section 2: Use of the Service */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">2. Use of the Service</h2>
            </div>
            <p>
              Satyam Verify allows citizens, researchers, and publishers to check the authenticity of media files and circulars against registered provenance records. You agree to use the service only for lawful personal, informational, or authorized organizational purposes.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>You may submit media (images, audio, video, documents, or text) to check against registered provenance data.</li>
              <li>You agree not to bypass rate limits, probe system vulnerabilities, or attempt to disable verification protections.</li>
              <li>You agree not to use automated scripts to spam or degrade service performance for other users.</li>
            </ul>
          </section>

          {/* Section 3: Verification Results and Limitations */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">3. Verification Results &amp; Limitations</h2>
            </div>
            <p>
              Satyam Verify produces verification verdicts (such as <em>Verified</em>, <em>Suspicious</em>, <em>Unsigned</em>, or <em>Invalid</em>) by calculating cryptographic hashes and perceptual matching features against records registered by participating publishers.
            </p>
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
              <p>
                <strong>Important Notice:</strong> Verification results indicate whether a submitted file matches a registered cryptographic provenance record in the database. An &ldquo;Unsigned&rdquo; result does not automatically mean content is fraudulent, but rather that no cryptographic provenance record exists in the registry.
              </p>
              <p>
                Verification verdicts are provided for informational verification purposes and do not constitute absolute legal guarantees or professional forensic certificates.
              </p>
            </div>
          </section>

          {/* Section 4: User Responsibilities */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">4. User Responsibilities</h2>
            </div>
            <p>When using Satyam Verify, you represent and agree that:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <li>You have the right to submit the content for evaluation.</li>
              <li>You will not upload files containing malware, viruses, or malicious payloads.</li>
              <li>Authorized publishers registering content are responsible for maintaining the confidentiality of their credentials and signing keys.</li>
            </ul>
          </section>

          {/* Section 5: Intellectual Property */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">5. Intellectual Property</h2>
            </div>
            <p>
              Content registered by publishers remains the property of the respective publisher or copyright holder. The Satyam Verify software, hashing mechanisms, verification algorithms, trademarks, and user interface designs are protected by applicable intellectual property rights.
            </p>
          </section>

          {/* Section 6: Third-Party Services */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Server className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">6. Third-Party Services</h2>
            </div>
            <p>
              The platform integrates with third-party providers including Meta WhatsApp Cloud API for automated messaging delivery and Amazon Web Services (AWS) for hosting and data storage. Use of WhatsApp verification is also subject to Meta&apos;s Terms of Service.
            </p>
          </section>

          {/* Section 7: Availability and Changes */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">7. Service Availability &amp; Modifications</h2>
            </div>
            <p>
              We strive to provide continuous availability, but the Platform is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. Features, endpoints, or verification capabilities may be updated, modified, or temporarily suspended for maintenance without prior notice.
            </p>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">8. Limitation of Liability</h2>
            </div>
            <p>
              To the maximum extent permitted by law, Satyam Verify, its contributors, and operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of, or inability to use, the platform or reliance upon any verification verdict.
            </p>
          </section>

          {/* Section 9: Contact Information */}
          <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">9. Contact Information</h2>
            </div>
            <p>
              For questions regarding these Terms of Service or general platform inquiries:
            </p>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Platform:</strong> Satyam Verify / Provenance Systems</p>
              <p><strong>Website:</strong> <a href="https://satyamorigin.online" className="text-emerald-600 dark:text-emerald-400 hover:underline">satyamorigin.online</a></p>
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
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-slate-900 dark:text-white font-semibold underline-offset-4 hover:underline"
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
