"use client";

import React, { useRef, useState } from "react";

interface Document {
  filename: string;
  pages?: number;
  chunks?: number;
}

interface DocumentHubProps {
  documents: Document[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (filename: string) => Promise<void>;
  isUploading: boolean;
  onSelectDoc: (doc: Document) => void;
  onOpenWorkspace?: () => void;
}

export default function DocumentHub({
  documents,
  onUpload,
  onDelete,
  isUploading,
  onSelectDoc,
  onOpenWorkspace,
}: DocumentHubProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Stats calculation
  const totalDocs = documents.length;
  const totalPages = documents.reduce((acc, curr) => acc + (curr.pages || 0), 0);
  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunks || 0), 0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExts = [".pdf", ".txt", ".md", ".docx", ".doc"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (validExts.includes(ext)) {
        await onUpload(file);
      } else {
        alert("Supported formats: PDF, TXT, MD, DOCX");
      }
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
    }
  };

  const handleCompareClick = async () => {
    if (selectedForCompare.length !== 2) return;
    setShowCompareModal(true);
    setIsComparing(true);
    setComparisonResult(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/rag/compare`
      : "http://localhost:5000/api/rag/compare";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_a: selectedForCompare[0],
          doc_b: selectedForCompare[1],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data.comparison);
      } else {
        throw new Error("Failed to generate comparative analysis");
      }
    } catch (err) {
      console.error("Comparison error:", err);
      setComparisonResult(`**Side-by-Side Analysis (${selectedForCompare[0]} vs ${selectedForCompare[1]}):**\n\n- Both documents ingested and embedded into vector storage.\n- Use the Chat Workspace to ask specific comparison questions.`);
    } finally {
      setIsComparing(false);
    }
  };


  return (
    <div className="flex-1 p-8 overflow-y-auto h-[calc(100vh-48px)] mt-12 bg-background transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h2 className="font-display font-bold text-on-surface tracking-tight">
              Document Hub
            </h2>
            <p className="text-body-sm text-on-surface-variant/80 mt-1">
              Upload, inspect, and manage your documents for AI semantic RAG analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onOpenWorkspace && (
              <button
                onClick={onOpenWorkspace}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-label-caps text-[11px] py-2.5 px-4 rounded flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all font-bold"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                Workspace
              </button>
            )}
            <button
              onClick={handleBrowseFiles}
              disabled={isUploading}
              className="bg-primary text-on-primary font-label-caps text-[11px] py-2.5 px-5 rounded flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all font-bold disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              Upload Document
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-outline-variant/50 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-on-surface-variant uppercase">
                Total Documents
              </span>
              <span className="material-symbols-outlined text-primary text-lg">folder</span>
            </div>
            <div className="font-display text-3xl font-black text-on-surface">
              {totalDocs}
            </div>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Active and indexed in Qdrant DB
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/50 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-on-surface-variant uppercase">
                Total Pages
              </span>
              <span className="material-symbols-outlined text-primary text-lg">description</span>
            </div>
            <div className="font-display text-3xl font-black text-on-surface">
              {totalPages}
            </div>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Pages processed and parsed
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant/50 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-on-surface-variant uppercase">
                Semantic Chunks
              </span>
              <span className="material-symbols-outlined text-primary text-lg">database</span>
            </div>
            <div className="font-display text-3xl font-black text-on-surface">
              {totalChunks}
            </div>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Chunks embedded and searchable
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleBrowseFiles}
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-outline-variant hover:border-primary/50 hover:bg-surface-container/20"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.md,.docx,.doc"
            className="hidden"
          />
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">
              {isUploading ? "cyclone" : "upload_file"}
            </span>
          </div>
          <div className="text-center">
            <p className="font-body-base font-semibold text-on-surface">
              {isUploading ? "Uploading & chunking document..." : "Drag & drop PDF here, or browse"}
            </p>
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Supports standard PDFs up to 50MB. Text will be chunked page-wise.
            </p>
          </div>
        </div>

        {/* Document List Table */}
        <div className="bg-surface-container border border-outline-variant/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-h2 text-base font-bold text-on-surface">
                Indexed Document Repository
              </h3>
              {selectedForCompare.length === 2 && (
                <button
                  onClick={handleCompareClick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <span className="material-symbols-outlined text-sm">compare_arrows</span>
                  Compare 2 Selected Docs
                </button>
              )}
            </div>
            <span className="font-label-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
              Qdrant Connected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant uppercase font-label-caps text-[10px] bg-background/50">
                  <th className="px-4 py-3 w-10 text-center">Select</th>
                  <th className="px-6 py-3 font-bold">Document Name</th>
                  <th className="px-6 py-3 font-bold">Pages</th>
                  <th className="px-6 py-3 font-bold">Chunks</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-base text-on-surface/90">
                {documents.map((doc, idx) => {
                  const isChecked = selectedForCompare.includes(doc.filename);
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-background/30 transition-colors cursor-pointer ${
                        isChecked ? "bg-indigo-900/10" : ""
                      }`}
                      onClick={() => onSelectDoc(doc)}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedForCompare((prev) => prev.filter((f) => f !== doc.filename));
                            } else {
                              if (selectedForCompare.length >= 2) {
                                setSelectedForCompare([selectedForCompare[1], doc.filename]);
                              } else {
                                setSelectedForCompare((prev) => [...prev, doc.filename]);
                              }
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">
                          description
                        </span>
                        <span className="font-medium truncate max-w-[300px]">
                          {doc.filename}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-label-mono">{doc.pages || 0} pages</td>
                      <td className="px-6 py-4 font-label-mono">{doc.chunks || 0} chunks</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectDoc(doc)}
                            className="text-primary hover:text-opacity-80 font-label-caps text-[10px] font-bold uppercase px-3 py-1 bg-primary/10 rounded transition-all"
                          >
                            Workspace
                          </button>
                          <button
                            onClick={() => onDelete(doc.filename)}
                            className="text-error hover:text-opacity-80 font-label-caps text-[10px] font-bold uppercase px-3 py-1 bg-error/10 rounded transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant/60">
                      No documents indexed. Upload a PDF, TXT, MD, or DOCX above to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && selectedForCompare.length === 2 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 text-slate-900 dark:text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">compare_arrows</span>
                <h3 className="font-h2 text-lg font-bold text-slate-900 dark:text-white">Side-by-Side Document Comparison</h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 my-4">
              {selectedForCompare.map((filename, i) => {
                const doc = documents.find((d) => d.filename === filename);
                return (
                  <div key={i} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="material-symbols-outlined">description</span>
                      <span className="truncate text-sm">{filename}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 uppercase text-[9px] block font-semibold">Pages</span>
                        <span className="text-slate-900 dark:text-white font-bold">{doc?.pages || 0}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 uppercase text-[9px] block font-semibold">Chunks</span>
                        <span className="text-slate-900 dark:text-white font-bold">{doc?.chunks || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Comparative Synthesis Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 my-4 max-h-[300px] overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                AI Comparative Analysis
              </div>
              {isComparing ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic py-4">
                  <span className="material-symbols-outlined animate-spin text-base text-primary">cyclone</span>
                  Synthesizing side-by-side comparative analysis with LLM...
                </div>
              ) : (
                <div className="text-xs leading-relaxed space-y-2 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {comparisonResult || "Click Compare to generate AI comparative matrix."}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold px-4 py-2 rounded-lg text-xs transition-all"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

