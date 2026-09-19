"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Type,
  ChevronDown,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCheck,
} from "lucide-react";

type ContentTypeKey = "IMAGE" | "VIDEO" | "AUDIO" | "PDF" | "TEXT";

interface ContentTypeConfig {
  key: ContentTypeKey;
  title: string;
  pill: string;
  type: "img" | "vid" | "aud" | "doc" | "txt";
  accept: string;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    key: "IMAGE",
    title: "Official Image / Infographic",
    pill: "PNG, JPG, WEBP",
    type: "img",
    accept: "image/png,image/jpeg,image/jpg,image/webp,image/gif",
  },
  {
    key: "VIDEO",
    title: "Official Video Broadcast",
    pill: "MP4, MOV, WEBM",
    type: "vid",
    accept: "video/mp4,video/quicktime,video/webm,video/x-msvideo",
  },
  {
    key: "AUDIO",
    title: "Audio Speech / Statement",
    pill: "WAV, MP3, M4A",
    type: "aud",
    accept: "audio/wav,audio/mpeg,audio/mp3,audio/m4a,audio/ogg",
  },
  {
    key: "PDF",
    title: "Official Gazette / Document",
    pill: "PDF",
    type: "doc",
    accept: "application/pdf",
  },
  {
    key: "TEXT",
    title: "Official Press Release",
    pill: "DIRECT TEXT / TXT",
    type: "txt",
    accept: "text/plain,.txt,.md",
  },
];

export default function RegisterContentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Content Type
  const [selectedType, setSelectedType] = useState<ContentTypeConfig>(CONTENT_TYPES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Dynamic Media Input
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pressReleaseText, setPressReleaseText] = useState("");

  // Metadata
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = (option: ContentTypeConfig) => {
    setSelectedType(option);
    setIsDropdownOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let fileToUpload: File | null = selectedFile;

    if (selectedType.key === "TEXT") {
      if (!pressReleaseText.trim()) {
        toast.error("Please enter the official statement or press release text.");
        return;
      }
      const safeTitle = (title.trim() || "official_statement").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const textBlob = new Blob([pressReleaseText.trim()], { type: "text/plain;charset=utf-8" });
      fileToUpload = new File([textBlob], `${safeTitle}.txt`, { type: "text/plain" });
    } else {
      if (!fileToUpload) {
        toast.error(`Please select or upload the official file for ${selectedType.title}.`);
        return;
      }
    }

    if (!title.trim()) {
      toast.error("Please enter a publication title.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const metadataPayload = {
        title: title.trim(),
        content_type: selectedType.key,
        description: description.trim() || null,
        department: department.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        timestamp: new Date().toISOString(),
      };

      formData.append("metadata", JSON.stringify(metadataPayload));

      if (privateKey.trim()) {
        formData.append("private_key", privateKey.trim());
      }

      const res = await api.post("/content/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setReceipt(res.data);
      toast.success("Content cryptographically registered and anchored!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.detail || "Content registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = (key: ContentTypeKey) => {
    switch (key) {
      case "IMAGE":
        return <ImageIcon style={{ width: 18, height: 18 }} />;
      case "VIDEO":
        return <Video style={{ width: 18, height: 18 }} />;
      case "AUDIO":
        return <Music style={{ width: 18, height: 18 }} />;
      case "PDF":
        return <FileText style={{ width: 18, height: 18 }} />;
      case "TEXT":
        return <Type style={{ width: 18, height: 18 }} />;
    }
  };

  return (
    <section id="view-register" className="tab-page active-view">
      <header className="page-header">
        <h1>Register Official Content</h1>
      </header>

      {receipt ? (
        /* Success Receipt Card */
        <div className="content-card panel" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "18px",
                background: "rgba(17, 183, 127, 0.15)",
                color: "var(--green)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CheckCircle2 style={{ width: 28, height: 28 }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Content Cryptographically Anchored
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Ledger Block #{receipt.hash_chain_block_id} • Content ID: {receipt.content_id?.substring(0, 16)}...
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "16px",
                background: "var(--bg-well)",
                boxShadow: "var(--well-shadow)",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                SHA-256 Cryptographic Hash
              </span>
              <div className="hash-well current" style={{ marginTop: "6px", wordBreak: "break-all" }}>
                {receipt.sha256_hash}
              </div>
            </div>

            {receipt.manifest_signature && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background: "var(--bg-well)",
                  boxShadow: "var(--well-shadow)",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  Ed25519 Manifest Signature
                </span>
                <div className="hash-well" style={{ marginTop: "6px", wordBreak: "break-all" }}>
                  {receipt.manifest_signature}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "8px" }}>
            <button
              className="primary-button"
              onClick={() => {
                setReceipt(null);
                setSelectedFile(null);
                setPressReleaseText("");
                setTitle("");
                setDescription("");
                setDepartment("");
                setTags("");
              }}
              type="button"
            >
              Register Another Asset
            </button>
            <Link
              href="/dashboard/content"
              className="primary-button"
              style={{
                background: "var(--bg-well)",
                color: "var(--text-primary)",
                boxShadow: "var(--well-shadow)",
              }}
            >
              View in Publications Registry
            </Link>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit}>
          <div className="content-card panel">
            {/* 1. Content Type Dropdown */}
            <div className="input-group">
              <label className="input-label">
                1. SELECT CONTENT TYPE <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <div className="dropdown-container" ref={dropdownRef}>
                <div
                  className="portal-dropdown-trigger"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="portal-icon-box" id="selected-icon">
                    {renderIcon(selectedType.key)}
                  </div>
                  <div className="portal-trigger-copy">
                    <span id="selected-title">{selectedType.title}</span>
                    <span className="portal-format-pill" id="selected-pill">
                      {selectedType.pill}
                    </span>
                  </div>
                  <ChevronDown
                    style={{
                      color: "var(--text-secondary)",
                      marginLeft: "auto",
                      transform: isDropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>

                {/* Dropdown Tray */}
                {isDropdownOpen && (
                  <div
                    className="portal-dropdown-tray"
                    id="custom-dropdown-tray"
                    style={{ display: "block" }}
                  >
                    {CONTENT_TYPES.map((option) => (
                      <div
                        key={option.key}
                        className={`portal-option-row ${
                          option.key === selectedType.key ? "active-row" : ""
                        }`}
                        onClick={() => handleSelectOption(option)}
                      >
                        <div className="portal-row-icon">{renderIcon(option.key)}</div>
                        <div className="portal-row-title">
                          {option.title} <span className="portal-row-tag">• {option.pill}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Input Area: File Dropzone OR Press Release Text Composer */}
            <div className="input-group">
              <label className="input-label" id="media-step-label">
                {selectedType.key === "TEXT"
                  ? "2. OFFICIAL STATEMENT CONTENT"
                  : "2. UPLOAD OFFICIAL MEDIA FILE"}{" "}
                <span style={{ color: "#ef4444" }}>*</span>
              </label>

              {selectedType.key === "TEXT" ? (
                /* Press Release Direct Text Composer */
                <div className="press-release-composer" id="press-release-box" style={{ display: "block" }}>
                  <div className="composer-header-row">
                    <span>Official Text Statement Editor</span>
                    <small id="char-count">{pressReleaseText.length} characters</small>
                  </div>
                  <textarea
                    className="composer-textarea"
                    value={pressReleaseText}
                    onChange={(e) => setPressReleaseText(e.target.value)}
                    placeholder="Type or paste the official government statement, press briefing, or announcement text here for cryptographic hash anchoring..."
                  />
                </div>
              ) : (
                /* Standard File Dropzone */
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={selectedType.accept}
                    style={{ display: "none" }}
                  />

                  <div
                    className="dropzone-clean"
                    id="file-dropzone-box"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      borderColor: isDragging ? "var(--green)" : undefined,
                      background: isDragging ? "var(--bg-hover)" : undefined,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          textAlign: "center",
                          width: "100%",
                        }}
                      >
                        <FileCheck
                          style={{
                            width: 44,
                            height: 44,
                            color: "var(--green)",
                            margin: "0 auto 8px auto",
                            display: "block",
                          }}
                        />
                        <strong
                          style={{
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            wordBreak: "break-all",
                            display: "block",
                            textAlign: "center",
                          }}
                        >
                          {selectedFile.name}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            display: "block",
                            textAlign: "center",
                          }}
                        >
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to anchor
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            color: "#ef4444",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: "transparent",
                            border: 0,
                          }}
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          width: "100%",
                        }}
                      >
                        <UploadCloud
                          style={{
                            width: 44,
                            height: 44,
                            color: "var(--green)",
                            margin: "0 auto 10px auto",
                            display: "block",
                          }}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            textAlign: "center",
                          }}
                        >
                          Tap to upload or drag &amp; drop official {selectedType.title.toLowerCase()}
                        </p>
                        <span
                          style={{
                            fontSize: "10.5px",
                            color: "var(--text-secondary)",
                            marginTop: "6px",
                            display: "block",
                            textAlign: "center",
                          }}
                        >
                          Accepted: {selectedType.pill}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 3. Metadata Section */}
            <div className="section-subhead">3. Publication Metadata</div>

            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label">
                  Publication Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="custom-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official Gazette Circular on Digital Media 2026"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Department / Division</label>
                <input
                  type="text"
                  className="custom-field"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Press Information Bureau / Ministry of I&B"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Description / Context</label>
              <textarea
                className="custom-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Official context and purpose of this publication..."
              />
            </div>

            <div className="input-group">
              <label className="input-label">Tags (Comma separated)</label>
              <input
                type="text"
                className="custom-field"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="press-release, gazette, announcement, national-security"
              />
            </div>

            {/* Optional External Signer Private Key */}
            <div className="input-group">
              <label className="input-label">
                Optional Ed25519 Private Key PEM (leave blank to sign with registered key)
              </label>
              <input
                type="password"
                className="custom-field"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Optional Ed25519 Private Key PEM..."
              />
            </div>

            {/* Bottom Actions */}
            <div className="form-actions-bottom">
              <button
                className="primary-button"
                type="submit"
                disabled={isSubmitting}
                id="submit-registration-btn"
              >
                {isSubmitting ? (
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
                    <span>Signing &amp; Anchoring...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck style={{ width: 16, height: 16 }} />
                    <span>Register &amp; Anchor Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
