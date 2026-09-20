"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/services/authStore";
import { api } from "@/services/api";
import { toast } from "sonner";
import { EvidenceMatrix, EvidenceData } from "@/components/EvidenceMatrix";

type ContentTabType = "video" | "audio" | "pdf" | "text";

const typeDescriptions: Record<"video" | "audio" | "pdf", string> = {
  video: "MP4 video files",
  audio: "MP3 audio files",
  pdf: "PDF documents",
};

const acceptedFormats: Record<"video" | "audio" | "pdf", string> = {
  video: ".mp4,video/mp4,.mov,video/quicktime,.webm,video/webm,.avi,video/x-msvideo,.mkv,video/x-matroska,.3gp,video/3gpp",
  audio: ".mp3,audio/mpeg,audio/mp3,.wav,audio/wav,.m4a,audio/mp4,audio/x-m4a,.ogg,audio/ogg,.flac,audio/flac,.aac,audio/aac",
  pdf: ".pdf,application/pdf",
};

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  // Navigation Destination for Get Started
  const getStartedHref = !isAuthenticated
    ? "/login"
    : user?.role === "ADMIN"
    ? "/admin/dashboard"
    : "/dashboard";

  // Verifier State
  const [activeTab, setActiveTab] = useState<ContentTabType>("video");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<EvidenceData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Element Refs for Parallax & Animations
  const heroImageRef = useRef<HTMLDivElement>(null);
  const heroVignetteRef = useRef<HTMLDivElement>(null);
  const heroAtmosphereRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parallax / Scroll Vignette Effect
  useEffect(() => {
    let ticking = false;

    const updateHeroAnimation = () => {
      const scroll = window.scrollY;
      const heroHeight = window.innerHeight || 680;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (heroImageRef.current) heroImageRef.current.style.transform = "scale(1)";
        if (heroVignetteRef.current) heroVignetteRef.current.style.height = "180px";
        if (heroAtmosphereRef.current) heroAtmosphereRef.current.style.opacity = "1";
        return;
      }

      // Camera pull back scale (1.05 -> 1.00)
      const scaleProgress = Math.min(scroll / 250, 1);
      const scale = 1.05 - 0.05 * scaleProgress;

      // Quarter-speed translation
      const translation = Math.min(scroll * -0.25, 70);

      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `translate3d(0, ${translation}px, 0) scale(${scale})`;
      }

      // Dynamic edge softening (40px -> 180px)
      const vignetteHeight = 40 + 140 * scaleProgress;
      if (heroVignetteRef.current) {
        heroVignetteRef.current.style.height = `${vignetteHeight}px`;
      }

      // Atmospheric opacity
      if (heroAtmosphereRef.current) {
        if (scroll > heroHeight * 0.55) {
          heroAtmosphereRef.current.style.opacity = "1";
        } else {
          heroAtmosphereRef.current.style.opacity = `${scaleProgress}`;
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeroAnimation();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateHeroAnimation();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Reveal Animations on Scroll (Intersection Observer)
  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.classList.contains("intro")) {
              setTimeout(() => {
                entry.target.classList.add("visible");
              }, 120);
            } else {
              entry.target.classList.add("visible");
            }
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  // Handle Tab Switch
  const handleTabChange = (type: ContentTabType) => {
    setActiveTab(type);
    setSelectedFile(null);
    setTextContent("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100 MB limit.");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100 MB limit.");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  // Handle Verification Execution
  const handleVerify = async () => {
    if (verifying) return;

    if (activeTab === "text") {
      const text = textContent.trim();
      if (!text) {
        toast.error("Please paste statement text to verify.");
        return;
      }

      setVerifying(true);
      setResult(null);

      try {
        const res = await api.post("/verify/text", { text });
        setResult(res.data);
        toast.success(`Verification complete: ${res.data.verdict}`);
      } catch (err: any) {
        console.error("Text verification failed", err);
        toast.error(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Verification request failed."
        );
      } finally {
        setVerifying(false);
      }
    } else {
      if (!selectedFile) {
        toast.error(`Please select a ${activeTab.toUpperCase()} file to verify.`);
        return;
      }

      setVerifying(true);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await api.post("/verify", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setResult(res.data);
        toast.success(`Verification complete: ${res.data.verdict}`);
      } catch (err: any) {
        console.error("File verification failed", err);
        toast.error(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Verification request failed."
        );
      } finally {
        setVerifying(false);
      }
    }
  };

  // Get Subtitle for Dropzone
  const getUploadSubtitle = () => {
    if (selectedFile) {
      return selectedFile.name;
    }
    if (activeTab !== "text") {
      return typeDescriptions[activeTab];
    }
    return "Choose a file";
  };

  return (
    <div className="landing-root">
      {/* Dynamic Scoped Design Styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap");

        :root {
          --page-bg: #e2e8ee;
          --fade-end: #f4f6f8;
          --black: #101513;
          --green: #174f3e;
          --green-dark: #10392d;
          --muted: #56645f;
          --light-text: #6f7b77;
          --border: rgba(20, 35, 31, 0.08);
        }

        html {
          scroll-behavior: smooth;
        }

        .landing-root {
          min-height: 100vh;
          margin: 0;
          overflow-x: hidden;
          background: var(--page-bg);
          color: var(--black);
          font-family: "DM Sans", Arial, sans-serif;
        }

        .landing-root button,
        .landing-root input,
        .landing-root textarea {
          font-family: inherit;
        }

        /* Navbar */
        .landing-navbar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 82px;
          padding: 0 5vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 50;
        }

        .landing-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 76px;
          height: 76px;
          margin-left: 10px;
          margin-top: 6px;
          overflow: hidden;
          text-decoration: none;
          transition: transform 0.25s ease;
        }

        .landing-logo img {
          display: block;
          width: 76px;
          height: auto;
          max-width: none;
          object-fit: contain;
          object-position: center center;
          transform: translateY(-3px) scale(1.15);
          transform-origin: center center;
        }

        .landing-logo:hover {
          transform: translateY(-1px);
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 26px;
        }

        .landing-nav-links a {
          color: #34413c;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .landing-nav-links a:hover {
          color: var(--green);
        }

        .landing-nav-cta {
          padding: 10px 17px;
          border-radius: 999px;
          background: #111513;
          color: #ffffff !important;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .landing-nav-cta:hover {
          background: #252c29;
          transform: translateY(-1px);
        }

        /* Hero */
        .landing-hero {
          position: relative;
          height: 100vh;
          min-height: 680px;
          overflow: hidden;
          background: var(--page-bg);
        }

        .landing-hero-image {
          position: absolute;
          top: -8%;
          left: -6%;
          width: 112%;
          height: 116%;
          background-image: url("/Gemini_Generated_Image_4xdbqj4xdbqj4xdb.png");
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          transform: scale(1.05);
          transform-origin: center center;
          will-change: transform;
          z-index: 0;
        }

        .landing-hero-light {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(226, 232, 238, 0.05),
            rgba(226, 232, 238, 0)
          );
          pointer-events: none;
          z-index: 1;
        }

        .landing-hero-vignette {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 40px;
          background: linear-gradient(
            to bottom,
            rgba(226, 232, 238, 0),
            rgba(226, 232, 238, 0.18) 18%,
            rgba(226, 232, 238, 0.55) 42%,
            rgba(226, 232, 238, 0.86) 70%,
            #e2e8ee 100%
          );
          pointer-events: none;
          z-index: 3;
          will-change: height;
        }

        .landing-hero-atmosphere {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 180px;
          background: linear-gradient(
            to bottom,
            rgba(226, 232, 238, 0),
            rgba(226, 232, 238, 0.32) 35%,
            rgba(226, 232, 238, 0.72) 67%,
            #e2e8ee 100%
          );
          opacity: 0;
          pointer-events: none;
          z-index: 4;
          will-change: opacity;
        }

        .landing-hero-content {
          position: absolute;
          left: 5vw;
          top: 50%;
          transform: translateY(-50%);
          max-width: 680px;
          z-index: 6;
          animation: heroEnter 1s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }

        .landing-hero-title {
          color: var(--black);
          font-size: clamp(62px, 7.3vw, 110px);
          line-height: 0.89;
          letter-spacing: -6px;
          font-weight: 600;
          margin: 0;
        }

        .landing-hero-title span {
          color: var(--green);
        }

        @keyframes heroEnter {
          from {
            opacity: 0;
            transform: translateY(calc(-50% + 30px));
          }
          to {
            opacity: 1;
            transform: translateY(-50%);
          }
        }

        /* Main */
        .landing-main {
          background: var(--page-bg);
          padding: 150px 5vw 110px;
        }

        .landing-container {
          width: min(1200px, 100%);
          margin: 0 auto;
        }

        /* Intro */
        .landing-intro {
          max-width: 980px;
          margin-bottom: 135px;
          opacity: 0.4;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.2, 0.7, 0.2, 1),
            transform 1s cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .landing-intro.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-section-label {
          margin-bottom: 20px;
          color: var(--green);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.8px;
        }

        .landing-intro-title {
          max-width: 1050px;
          font-size: clamp(55px, 7vw, 98px);
          line-height: 0.91;
          letter-spacing: -5px;
          font-weight: 600;
          margin: 0;
        }

        .landing-intro-title span {
          color: var(--green);
        }

        .landing-intro-description {
          max-width: 670px;
          margin-top: 32px;
          color: var(--muted);
          font-size: 18px;
          line-height: 1.7;
        }

        /* Verification Section */
        .landing-verification-section {
          display: grid;
          grid-template-columns: 0.78fr 1.22fr;
          gap: 80px;
          align-items: start;
          margin-bottom: 135px;
        }

        .landing-verification-copy {
          padding-top: 25px;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .landing-verification-copy.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-verification-copy h2 {
          max-width: 490px;
          margin-bottom: 22px;
          font-size: clamp(42px, 4.3vw, 60px);
          line-height: 0.96;
          letter-spacing: -3.2px;
          font-weight: 600;
        }

        .landing-verification-copy p {
          max-width: 440px;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.7;
        }

        /* Verifier Card */
        .landing-verifier-card {
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.68);
          border-radius: 26px;
          background: rgba(248, 250, 250, 0.67);
          box-shadow: 0 20px 60px rgba(26, 45, 51, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.85s ease 0.08s,
            transform 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) 0.08s;
        }

        .landing-verifier-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-verifier-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .landing-verifier-heading h3 {
          font-size: 24px;
          line-height: 1;
          letter-spacing: -0.7px;
          font-weight: 600;
          margin: 0;
        }

        .landing-verifier-heading p {
          margin-top: 7px;
          color: var(--light-text);
          font-size: 12px;
          margin-bottom: 0;
        }

        .landing-secure-pill {
          flex-shrink: 0;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(23, 79, 62, 0.08);
          color: var(--green);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Content Types */
        .landing-content-types {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 15px;
        }

        .landing-content-type {
          min-height: 70px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.4);
          color: #252c29;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .landing-content-type:hover {
          transform: translateY(-2px);
        }

        .landing-content-type.active {
          background: var(--green);
          color: white;
          border-color: var(--green);
        }

        .landing-content-type-icon {
          display: block;
          margin-bottom: 5px;
          font-size: 17px;
          line-height: 1;
        }

        .landing-content-type-name {
          font-size: 11px;
          font-weight: 600;
        }

        /* Upload */
        .landing-upload-area {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 25px;
          border: 1.5px dashed rgba(23, 79, 62, 0.25);
          border-radius: 19px;
          background: rgba(242, 247, 245, 0.55);
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .landing-upload-area:hover,
        .landing-upload-area.drag-over {
          border-color: var(--green);
          background: rgba(237, 245, 241, 0.8);
          transform: translateY(-2px);
        }

        .landing-upload-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 14px;
          background: rgba(23, 79, 62, 0.08);
          color: var(--green);
          font-size: 21px;
          font-weight: 700;
        }

        .landing-upload-title {
          margin-bottom: 5px;
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
        }

        .landing-upload-subtitle {
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--light-text);
          font-size: 11px;
        }

        /* Text Input */
        .landing-text-input {
          width: 100%;
          min-height: 190px;
          padding: 18px;
          border: 1px solid rgba(23, 79, 62, 0.18);
          border-radius: 18px;
          outline: none;
          resize: vertical;
          background: rgba(248, 250, 249, 0.75);
          color: var(--black);
          font-size: 14px;
          line-height: 1.6;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .landing-text-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(23, 79, 62, 0.06);
        }

        /* Verify Button */
        .landing-verify-button {
          width: 100%;
          margin-top: 14px;
          padding: 16px 22px;
          border: none;
          border-radius: 999px;
          background: var(--green);
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .landing-verify-button:hover:not(:disabled) {
          background: #21614c;
          transform: translateY(-2px);
        }

        .landing-verify-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* WhatsApp */
        .landing-whatsapp {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 50px;
          padding: 60px;
          border-radius: 30px;
          background: #123b30;
          color: #ffffff;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.85s ease, transform 0.85s cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .landing-whatsapp.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-whatsapp-label {
          margin-bottom: 15px;
          color: #9bcbb9;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.9px;
          text-transform: uppercase;
        }

        .landing-whatsapp h2 {
          max-width: 680px;
          font-size: clamp(42px, 5vw, 65px);
          line-height: 0.96;
          letter-spacing: -3.5px;
          font-weight: 600;
          margin: 0;
        }

        .landing-whatsapp h2 span {
          color: #9ed1bf;
        }

        .landing-whatsapp-description {
          max-width: 610px;
          margin-top: 22px;
          color: #c4d4ce;
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 0;
        }

        .landing-whatsapp-box {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-whatsapp-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          padding: 0 28px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: #9ed1bf;
          color: #123b30;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.1px;
          white-space: nowrap;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }

        .landing-whatsapp-link:hover {
          background: #b6e1d1;
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.17);
        }

        /* Footer */
        .landing-footer {
          width: 100%;
          padding: 30px 5vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: var(--page-bg);
          color: #697570;
          font-size: 10px;
        }

        .landing-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .landing-footer-links a {
          padding: 8px 13px;
          border: 1px solid rgba(30, 42, 37, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.3);
          color: #4e5954;
          text-decoration: none;
          font-size: 10px;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .landing-footer-links a:hover {
          background: rgba(255, 255, 255, 0.6);
          color: var(--black);
        }

        /* Tablet Breakpoint (max-width: 850px) */
        @media (max-width: 850px) {
          .landing-nav-links a:not(.landing-nav-cta) {
            display: none;
          }

          .landing-verification-section {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .landing-whatsapp {
            flex-direction: column;
            align-items: flex-start;
          }

          .landing-whatsapp-box {
            width: 100%;
            justify-content: flex-start;
          }

          .landing-whatsapp-link {
            min-height: 54px;
            padding: 0 24px;
            font-size: 13px;
          }
        }

        /* Mobile Breakpoint (max-width: 650px) */
        @media (max-width: 650px) {
          .landing-navbar {
            height: 72px;
            padding: 0 20px;
          }

          .landing-logo {
            width: 64px;
            height: 64px;
            margin-left: 0;
            margin-top: 4px;
          }

          .landing-logo img {
            width: 64px;
            height: auto;
            transform: translateY(-2px) scale(1.15);
          }

          .landing-hero {
            min-height: 650px;
          }

          .landing-hero-image {
            left: -15%;
            width: 130%;
            background-position: center center;
          }

          .landing-hero-content {
            left: 24px;
            right: 24px;
          }

          .landing-hero-title {
            font-size: clamp(55px, 15vw, 78px);
            letter-spacing: -4px;
          }

          .landing-main {
            padding: 100px 20px 70px;
          }

          .landing-intro-title {
            font-size: 58px;
            letter-spacing: -4px;
          }

          .landing-intro-description {
            font-size: 16px;
          }

          .landing-content-types {
            grid-template-columns: repeat(2, 1fr);
          }

          .landing-verifier-card {
            padding: 20px;
            border-radius: 22px;
          }

          .landing-whatsapp {
            padding: 38px 25px;
            border-radius: 25px;
          }

          .landing-whatsapp h2 {
            font-size: 43px;
            letter-spacing: -2.7px;
          }

          .landing-footer {
            flex-direction: column;
            padding: 28px 20px;
            text-align: center;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .landing-hero-image {
            transform: scale(1) !important;
          }

          .landing-intro,
          .landing-verification-copy,
          .landing-verifier-card,
          .landing-whatsapp {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      {/* =========================================================
          1. NAVIGATION
          ========================================================== */}
      <header className="landing-navbar">
        <Link href="#top" className="landing-logo" aria-label="SatyamVerify home">
          <Image
            src="/satyamverify-logo.png"
            alt="SatyamVerify"
            width={76}
            height={76}
            priority
          />
        </Link>

        <nav className="landing-nav-links">
          <a href="#verify">Verify</a>
          <a href="#whatsapp">WhatsApp</a>
          <Link href={getStartedHref} className="landing-nav-cta">
            Get Started ↗
          </Link>
        </nav>
      </header>

      {/* =========================================================
          2. HERO SECTION
          ========================================================== */}
      <section className="landing-hero" id="top">
        {/* Background Image with Parallax Pull-Back */}
        <div className="landing-hero-image" ref={heroImageRef} />

        <div className="landing-hero-light" />

        {/* Dynamic Edge Softening Vignette & Atmosphere */}
        <div className="landing-hero-vignette" ref={heroVignetteRef} />
        <div className="landing-hero-atmosphere" ref={heroAtmosphereRef} />

        {/* Hero Title */}
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Before you
            <br />
            <span>trust it.</span>
          </h1>
        </div>
      </section>

      {/* =========================================================
          3. MAIN CONTENT AREA
          ========================================================== */}
      <main className="landing-main">
        <div className="landing-container">
          {/* Section: Intro / Delayed Typography */}
          <section className="landing-intro reveal">
            <div className="landing-section-label">DIGITAL PROVENANCE</div>
            <h2 className="landing-intro-title">
              Know what
              <br />
              <span>you're seeing.</span>
            </h2>
            <p className="landing-intro-description">
              Not everything that looks real is real. SatyamVerify checks where digital
              content came from, whether it has been altered, and whether it can be trusted.
            </p>
          </section>

          {/* Section: Verification */}
          <section className="landing-verification-section" id="verify">
            <div className="landing-verification-copy reveal">
              <h2>Got something you're not sure about?</h2>
              <p>
                Drop it here. SatyamVerify checks the content against its provenance records
                and gives you a simple result.
              </p>
            </div>

            {/* Verifier Card */}
            <div className="landing-verifier-card reveal">
              <div className="landing-verifier-heading">
                <div>
                  <h3>Check a file</h3>
                  <p>Choose what you want to verify</p>
                </div>
                <div className="landing-secure-pill">SECURE</div>
              </div>

              {/* Content Type Tabs */}
              <div className="landing-content-types">
                <button
                  type="button"
                  onClick={() => handleTabChange("video")}
                  className={`landing-content-type ${activeTab === "video" ? "active" : ""}`}
                >
                  <span className="landing-content-type-icon">◉</span>
                  <span className="landing-content-type-name">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("audio")}
                  className={`landing-content-type ${activeTab === "audio" ? "active" : ""}`}
                >
                  <span className="landing-content-type-icon">♪</span>
                  <span className="landing-content-type-name">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("pdf")}
                  className={`landing-content-type ${activeTab === "pdf" ? "active" : ""}`}
                >
                  <span className="landing-content-type-icon">▤</span>
                  <span className="landing-content-type-name">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("text")}
                  className={`landing-content-type ${activeTab === "text" ? "active" : ""}`}
                >
                  <span className="landing-content-type-icon">Aa</span>
                  <span className="landing-content-type-name">Text</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={activeTab !== "text" ? acceptedFormats[activeTab] : undefined}
                style={{ display: "none" }}
              />

              {/* Dynamic Input: File Dropzone OR Text Area */}
              {activeTab === "text" ? (
                <textarea
                  className="landing-text-input"
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    setResult(null);
                  }}
                  placeholder="Paste the text you want to verify..."
                />
              ) : (
                <label
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`landing-upload-area ${isDragOver ? "drag-over" : ""}`}
                >
                  <div className="landing-upload-icon">↑</div>
                  <div className="landing-upload-title">
                    {selectedFile ? "File Selected" : "Drop it here or choose a file"}
                  </div>
                  <div className="landing-upload-subtitle">{getUploadSubtitle()}</div>
                </label>
              )}

              {/* Submit Verification Button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="landing-verify-button"
              >
                {verifying ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Verifying Cryptographic Ledger...</span>
                  </>
                ) : (
                  <span>Verify Content ↗</span>
                )}
              </button>

              {/* Verification Results Display */}
              {result && (
                <div style={{ marginTop: "24px" }}>
                  <EvidenceMatrix data={result} />
                </div>
              )}
            </div>
          </section>

          {/* Section: WhatsApp Banner */}
          <section className="landing-whatsapp reveal" id="whatsapp">
            <div>
              <div className="landing-whatsapp-label">THE EASIER WAY</div>
              <h2>
                See something suspicious?
                <br />
                <span>Just send it.</span>
              </h2>
              <p className="landing-whatsapp-description">
                You don't even need to open the website. Send the video, audio, PDF or content
                directly to our WhatsApp provenance number. SatyamVerify handles the
                verification and sends a simple verdict back.
              </p>
            </div>

            <div className="landing-whatsapp-box">
              <a
                href="https://wa.me/919288532901?text=Verify"
                target="_blank"
                rel="noopener noreferrer"
                className="landing-whatsapp-link"
              >
                Verify on WhatsApp ↗
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================================
          4. FOOTER
          ========================================================== */}
      <footer className="landing-footer">
        <div>© 2026 SatyamVerify</div>

        <div className="landing-footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/data-deletion">Data Deletion</Link>
        </div>

        <div>Authenticity · Provenance · Integrity</div>
      </footer>
    </div>
  );
}
