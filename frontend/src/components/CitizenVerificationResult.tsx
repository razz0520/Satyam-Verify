"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  Globe,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/Badge";

export interface CitizenEvidenceData {
  verification_id?: string;
  submitted_hash?: string;
  verdict: "VERIFIED" | "SUSPICIOUS" | "UNSIGNED" | "PROVEN_INVALID" | string;
  confidence_score: number;
  verification_time_ms?: number;
  evidence_bundle?: {
    match_type?: string;
    similarity_score?: number;
    perceptual_similarity_score?: number | null;
    publisher_name?: string | null;
    publisher_domain?: string | null;
    notice?: string | null;
    [key: string]: any;
  };
  created_at?: string;
}

interface CitizenVerificationResultProps {
  data: CitizenEvidenceData;
}

export function CitizenVerificationResult({ data }: CitizenVerificationResultProps) {
  const { verdict, confidence_score, evidence_bundle } = data;
  const v = (verdict || "UNSIGNED").toUpperCase();

  const isVerified = v === "VERIFIED";
  const isSuspicious = v === "SUSPICIOUS";
  const isInvalid = v === "PROVEN_INVALID";
  const isUnsigned = v === "UNSIGNED";

  // Citizen-friendly Verdict Title
  const getVerdictTitle = () => {
    if (isVerified) return "Official Content Verified";
    if (isSuspicious) return "Potential Deepfake / Modified Content";
    if (isInvalid) return "Invalid / Revoked Official Content";
    return "No Official Provenance Record Found";
  };

  // Citizen-friendly Explanation / Notice
  const getVerdictExplanation = () => {
    if (evidence_bundle?.notice && evidence_bundle.notice.trim().length > 0) {
      return evidence_bundle.notice.trim();
    }
    if (isVerified) {
      return "This content matches an official registered publication. Its authenticity and origin have been verified.";
    }
    if (isSuspicious) {
      return "Content shows similarity to an official publication, but structural or perceptual differences were detected.";
    }
    if (isInvalid) {
      return "This publication has been officially retracted, revoked, or failed provenance validation.";
    }
    return "No matching official provenance record exists in the national registry for this submitted statement or file.";
  };

  // Verdict Icon
  const getVerdictIcon = () => {
    if (isVerified) {
      return <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 flex-shrink-0" />;
    }
    if (isSuspicious) {
      return <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0" />;
    }
    if (isInvalid) {
      return <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400 flex-shrink-0" />;
    }
    return <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 flex-shrink-0" />;
  };

  // Verdict Color Theme Tokens
  const getCardStyle = () => {
    if (isVerified) {
      return {
        cardBorder: "border-emerald-500/30",
        cardBg: "bg-emerald-950/20",
        iconBoxBg: "bg-emerald-500/10 border-emerald-500/20",
        highlightGlow: "shadow-[0_0_24px_rgba(16,185,129,0.08)]",
      };
    }
    if (isSuspicious) {
      return {
        cardBorder: "border-amber-500/30",
        cardBg: "bg-amber-950/20",
        iconBoxBg: "bg-amber-500/10 border-amber-500/20",
        highlightGlow: "shadow-[0_0_24px_rgba(245,158,11,0.08)]",
      };
    }
    if (isInvalid) {
      return {
        cardBorder: "border-rose-500/30",
        cardBg: "bg-rose-950/20",
        iconBoxBg: "bg-rose-500/10 border-rose-500/20",
        highlightGlow: "shadow-[0_0_24px_rgba(244,63,94,0.08)]",
      };
    }
    return {
      cardBorder: "border-slate-700/40",
      cardBg: "bg-slate-900/30",
      iconBoxBg: "bg-slate-800/40 border-slate-700/40",
      highlightGlow: "shadow-[0_0_24px_rgba(100,116,139,0.06)]",
    };
  };

  const styles = getCardStyle();

  // Metrics Data Extraction
  const rawConfidence = confidence_score ?? 0;
  const formattedConfidence = (
    rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence
  ).toFixed(1);

  // Similarity score check (display only when available and > 0)
  const rawSimilarity =
    evidence_bundle?.similarity_score ?? evidence_bundle?.perceptual_similarity_score;
  const hasSimilarity =
    rawSimilarity !== undefined &&
    rawSimilarity !== null &&
    !isNaN(Number(rawSimilarity)) &&
    Number(rawSimilarity) > 0;
  const formattedSimilarity = hasSimilarity
    ? (Number(rawSimilarity) <= 1 ? Number(rawSimilarity) * 100 : Number(rawSimilarity)).toFixed(
        Number(rawSimilarity) % 1 !== 0 ? 2 : 1
      )
    : null;

  // Publisher Info
  const publisherName = evidence_bundle?.publisher_name?.trim() || null;
  const publisherDomain = evidence_bundle?.publisher_domain?.trim() || null;
  const hasPublisher = Boolean(publisherName);

  return (
    <section
      aria-label="Citizen Verification Result"
      className={`w-full rounded-2xl sm:rounded-3xl border backdrop-blur-xl transition-all duration-300 ${styles.cardBorder} ${styles.cardBg} ${styles.highlightGlow} overflow-hidden`}
      style={{
        boxShadow: "0 12px 36px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Banner / Verdict Header */}
      <div className="p-5 sm:p-7 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border flex-shrink-0 ${styles.iconBoxBg}`}
            >
              {getVerdictIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                  {getVerdictTitle()}
                </h3>
                <Badge variant={verdict}>{verdict}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Citizen Explanation */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl pt-1">
          {getVerdictExplanation()}
        </p>
      </div>

      {/* Metrics Section: 3-Column Responsive Cards */}
      <div className="border-t border-white/[0.08] bg-black/20 p-4 sm:p-6 md:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Confidence */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Confidence</span>
              <Percent className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formattedConfidence}%
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Algorithmic certainty
              </div>
            </div>
          </div>

          {/* Card 2: Similarity (Gracefully rendered when available) */}
          {hasSimilarity ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Similarity</span>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formattedSimilarity}%
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Match to registered content
                </div>
              </div>
            </div>
          ) : (
            /* Fallback Card if similarity not applicable (e.g. purely Unsigned / No similarity) */
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Registry Status</span>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {isVerified ? "Registered & Signed" : isSuspicious ? "Altered Content" : isInvalid ? "Invalid Publication" : "Unregistered"}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  National provenance ledger
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Official Publisher (Gracefully rendered when available) */}
          {hasPublisher ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Official Publisher</span>
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-white tracking-tight truncate" title={publisherName!}>
                  {publisherName}
                </div>
                {publisherDomain ? (
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 font-mono mt-0.5 truncate">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span>{publisherDomain}</span>
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Verified authority
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Official Publisher</span>
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-slate-400 tracking-tight">
                  Not Identified
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  No official publisher claim found
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
