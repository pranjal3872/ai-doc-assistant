"use client";

import React, { useRef, useState } from "react";

interface Document {
  filename: string;
  pages?: number;
  chunks?: number;
}

interface SidebarProps {
  currentView: "workspace" | "document_hub";
  setView: (view: "workspace" | "document_hub") => void;
  documents: Document[];
  selectedDoc: Document | null;
  setSelectedDoc: (doc: Document | null) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  onLogout?: () => void;
}

export default function Sidebar({
  currentView,
  setView,
  documents,
  selectedDoc,
  setSelectedDoc,
  onUpload,
  isUploading,
  onLogout,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onUpload(e.target.files[0]);
    }
  };

  return (
    <aside className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-screen w-sidebar fixed left-0 top-0 border-r border-slate-200 dark:border-slate-800 flex flex-col py-4 px-4 z-50 transition-colors">
      <div className="mb-6 mt-1">
        <button
          onClick={() => {
            setSelectedDoc(null);
            setView("document_hub");
          }}
          className="text-left group cursor-pointer focus:outline-none"
          title="Go to Home Page"
        >
          <h1 className="font-h1 font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
            AI Doc Assistant
          </h1>
          <p className="font-label-caps text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Qdrant Connected
          </p>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="bg-primary text-white font-label-caps text-[11px] py-3 px-4 rounded flex items-center justify-center gap-2 mb-6 hover:opacity-90 active:scale-95 transition-all cursor-pointer font-bold disabled:opacity-50 shadow-md"
      >
        <span className="material-symbols-outlined text-base">
          {isUploading ? "cyclone" : "upload_file"}
        </span>
        {isUploading ? "Uploading..." : "Upload PDF"}
      </button>

      <nav className="flex-1 space-y-1">
        {/* Navigation items */}
        <button
          onClick={() => setView("document_hub")}
          className={`w-full text-left font-bold flex items-center gap-3 px-3 py-2 transition-colors duration-200 rounded ${
            currentView === "document_hub"
              ? "text-primary border-l-2 border-primary bg-indigo-50 dark:bg-slate-800/80 font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40"
          }`}
        >
          <span className="material-symbols-outlined text-lg">folder</span>
          <span className="font-label-caps uppercase">Documents</span>
        </button>
        <button
          onClick={() => setView("workspace")}
          className={`w-full text-left font-bold flex items-center gap-3 px-3 py-2 transition-colors duration-200 rounded ${
            currentView === "workspace"
              ? "text-primary border-l-2 border-primary bg-indigo-50 dark:bg-slate-800/80 font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40"
          }`}
        >
          <span className="material-symbols-outlined text-lg">grid_view</span>
          <span className="font-label-caps uppercase">Workspace</span>
        </button>
      </nav>

      {/* Document List Section */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex-1 overflow-y-auto">
        <h3 className="font-label-caps text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-widest font-semibold">
          Indexed Documents
        </h3>
        <div className="space-y-2">
          {documents.map((doc, idx) => {
            const isSelected = selectedDoc?.filename === doc.filename;
            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDoc(doc);
                  setView("workspace");
                }}
                className={`p-3 rounded-sm border cursor-pointer group transition-all ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-slate-800/80 border-indigo-300 dark:border-primary/50 text-indigo-900 dark:text-white font-semibold"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`material-symbols-outlined text-sm transition-colors ${
                      isSelected
                        ? "text-primary"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
                    }`}
                  >
                    description
                  </span>
                  <span
                    className={`font-label-mono text-[11px] truncate block max-w-[190px] ${
                      isSelected ? "text-indigo-900 dark:text-white" : "group-hover:text-indigo-600 dark:group-hover:text-white"
                    }`}
                  >
                    {doc.filename}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-label-mono uppercase">
                  <span>{doc.pages || 0} pages</span>
                  <span>{doc.chunks || 0} chunks</span>
                </div>
              </div>
            );
          })}

          {documents.length === 0 && (
            <p className="text-body-sm italic text-on-surface-variant/50 p-2">
              No documents indexed.
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant/30 space-y-1">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-3 px-3 py-2 transition-colors duration-200 text-body-sm font-semibold w-full text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span className="font-label-caps uppercase">Help & Guide</span>
        </button>
        <button
          onClick={onLogout}
          className="text-on-surface-variant hover:text-red-400 flex items-center gap-3 px-3 py-2 transition-colors duration-200 text-body-sm font-semibold w-full text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="font-label-caps uppercase">Logout</span>
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">help</span>
                <h3 className="font-h2 text-lg font-bold text-white">AI Doc Assistant Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="py-4 space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-bold text-primary mb-1">📄 1. Upload & Index Documents</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <b>Upload PDF</b> to upload any document. Your document is split into page-wise text chunks and embedded into Qdrant vector database.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-1">💬 2. Ask Questions & Target Scope</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the <b>Target Scope</b> dropdown to ask questions about a specific PDF or search across all indexed files.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-1">🌐 3. Web Search Integration</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Include keywords like <i>"web"</i>, <i>"latest"</i>, or <i>"news"</i> in your query to trigger live Tavily internet search.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
