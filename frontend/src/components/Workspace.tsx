"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";

interface Chunk {
  id: number;
  text: string;
}

interface PageData {
  page: number;
  text: string;
  chunks: Chunk[];
}

interface DocumentDetail {
  filename: string;
  pages: PageData[];
}

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface Document {
  filename: string;
  pages?: number;
  chunks?: number;
}

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/rag` : "http://localhost:5000/api/rag";
const DIRECT_RAG_URL = process.env.NEXT_PUBLIC_RAG_URL || "http://127.0.0.1:8000";

interface WorkspaceProps {
  selectedDoc: Document | null;
  documents: Document[];
  onSendMessage: (query: string) => Promise<string>;
  setSelectedDoc?: (doc: Document | null) => void;
  onUpload?: (file: File) => Promise<void>;
}

export default function Workspace({
  selectedDoc,
  documents,
  onSendMessage,
  setSelectedDoc,
  onUpload,
}: WorkspaceProps) {
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  // Document Viewer states
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [highlightChunks, setHighlightChunks] = useState<boolean>(true);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);

  // Chat states
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! Select a document from the sidebar and ask me any questions about its content. I can search through chunks, retrieve context, and provide citations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  // Citation hover tooltip state
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    text: string;
    label: string;
    x: number;
    y: number;
  }>({ show: false, text: "", label: "", x: 0, y: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch document details when selectedDoc changes
  useEffect(() => {
    if (!selectedDoc) {
      setDocDetail(null);
      return;
    }

    const fetchDocContent = async () => {
      setIsLoadingDoc(true);
      try {
        let res = await fetch(`${API_GATEWAY_URL}/documents/${encodeURIComponent(selectedDoc.filename)}`);
        if (!res.ok) {
          res = await fetch(`${DIRECT_RAG_URL}/documents/${encodeURIComponent(selectedDoc.filename)}`);
        }
        if (res.ok) {
          const data = await res.json();
          setDocDetail(data);
          setCurrentPageIndex(0);
        } else {
          // Fallback if not found or server is down
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        console.error("Error fetching doc details, setting mock fallback details:", err);
        // Resilient mock details mirroring the design specs
        setDocDetail({
          filename: selectedDoc.filename,
          pages: [
            {
              page: 1,
              text: "AI Document Assistant - Project Overview and Architecture details. Document classification is driven by advanced semantic search algorithms integrated with a high-performance vector database.",
              chunks: [
                { id: 0, text: "AI Document Assistant - Project Overview and Architecture details." },
                { id: 1, text: "Document classification is driven by advanced semantic search algorithms integrated with a high-performance vector database." }
              ]
            },
            {
              page: 2,
              text: "The retrieval pipeline uses Langchain components connected to Qdrant. The system is designed to segment PDFs page-wise and embed them using fast sentences embeddings models.",
              chunks: [
                { id: 2, text: "The retrieval pipeline uses Langchain components connected to Qdrant." },
                { id: 3, text: "The system is designed to segment PDFs page-wise and embed them using fast sentences embeddings models." }
              ]
            },
            {
              page: 3,
              text: "Operating Performance & Strategic Initiatives. During the fiscal year ended December 31, 2023, the Company demonstrated significant resilience in its core business operations. Revenue growth was primarily driven by the expansion of the digital services segment, which accounted for 42% of total consolidated earnings. The net profit margin improved by 450 basis points compared to the previous year, reaching an all-time high of 18.2%. This optimization was attributed to the successful implementation of AI-assisted operational workflows across all logistics divisions. Market volatility remained a headwind; however, the early adoption of adaptive risk management frameworks provided a buffer against inflationary pressures.",
              chunks: [
                { id: 4, text: "Operating Performance & Strategic Initiatives. During the fiscal year ended December 31, 2023, the Company demonstrated significant resilience in its core business operations. Revenue growth was primarily driven by the expansion of the digital services segment, which accounted for 42% of total consolidated earnings." },
                { id: 5, text: "The net profit margin improved by 450 basis points compared to the previous year, reaching an all-time high of 18.2%. This optimization was attributed to the successful implementation of AI-assisted operational workflows across all logistics divisions." },
                { id: 6, text: "Market volatility remained a headwind; however, the early adoption of adaptive risk management frameworks provided a buffer against inflationary pressures." }
              ]
            }
          ]
        });
        setCurrentPageIndex(0);
      } finally {
        setIsLoadingDoc(false);
      }
    };

    fetchDocContent();
  }, [selectedDoc]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isSearching, currentTool]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSearching) return;

    const userText = inputValue;
    setInputValue("");
    setChatHistory((prev) => [
      ...prev,
      {
        role: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsSearching(true);
    // Simulate thinking activity feed
    setCurrentTool("retrieve_documents");

    setTimeout(() => {
      setCurrentTool("web_search (Tavily)");
    }, 1500);

    try {
      const answer = await onSendMessage(userText);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error communicating with the RAG service. Please verify if the API is online at 127.0.0.1:8000.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSearching(false);
      setCurrentTool(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Active chunk highlight on citation click
  const [highlightedChunkText, setHighlightedChunkText] = useState<string | null>(null);

  // Navigates to a specific page parsed from a citation click
  const handleCitationClick = (text: string) => {
    // Look for patterns like "filename.pdf • Page X" or "Page X"
    const docMatch = text.match(/([a-zA-Z0-9_\-\s\(\)]+\.pdf)\s*•?\s*Page\s*(\d+)/i);
    const pageMatch = text.match(/Page\s+(\d+)/i) || text.match(/page\s+(\d+)/i);

    let targetDocName = docMatch ? docMatch[1].trim() : null;
    let targetPage = docMatch ? parseInt(docMatch[2], 10) : (pageMatch ? parseInt(pageMatch[1], 10) : null);

    if (targetDocName && setSelectedDoc && selectedDoc?.filename !== targetDocName) {
      const found = documents.find((d) => d.filename.toLowerCase() === targetDocName.toLowerCase());
      if (found) {
        setSelectedDoc(found);
      }
    }

    if (targetPage !== null && docDetail) {
      const pageIdx = docDetail.pages.findIndex(p => p.page === targetPage);
      if (pageIdx !== -1) {
        setCurrentPageIndex(pageIdx);
        // Highlight first chunk on the page or matching excerpt
        setHighlightedChunkText(text);
        setTimeout(() => setHighlightedChunkText(null), 4000);
      }
    }
  };

  // Enhanced response renderer supporting markdown bold headers, bullets, line breaks, and interactive citation pills
  const renderResponseText = (text: string) => {
    const renderInlineCitations = (lineText: string) => {
      const parts = lineText.split(/(\[[^\]]+\])/g);
      return parts.map((part, idx) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          const cleaned = part.slice(1, -1);
          return (
            <span
              key={idx}
              onClick={() => handleCitationClick(cleaned)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: `Excerpt source from Qdrant: "${cleaned}". Click to navigate to this page in the document viewer.`,
                  label: cleaned.toUpperCase(),
                  x: rect.left,
                  y: rect.top - 10,
                });
              }}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, show: false }))}
              className="inline-flex items-center gap-1 bg-primary/15 px-2 py-0.5 rounded-full text-[10px] font-label-mono text-primary cursor-pointer hover:bg-primary/25 transition-all mx-1 font-semibold"
            >
              {part}
            </span>
          );
        }

        const subParts = part.split(/(\*\*[^*]+\*\*)/g);
        return subParts.map((sub, sIdx) => {
          if (sub.startsWith("**") && sub.endsWith("**")) {
            const boldText = sub.slice(2, -2);
            return (
              <strong key={sIdx} className="font-bold text-primary dark:text-sky-300">
                {boldText}
              </strong>
            );
          }
          return <span key={sIdx}>{sub}</span>;
        });
      });
    };

    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-1" />;

          if (trimmed.startsWith("**") && (trimmed.endsWith("**") || trimmed.includes(":**"))) {
            return (
              <div key={lineIdx} className="font-bold text-sm text-primary dark:text-sky-300 mt-2.5 mb-1 border-b border-outline-variant/30 pb-0.5">
                {renderInlineCitations(trimmed)}
              </div>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
            const bulletContent = trimmed.replace(/^[-*•]\s+/, "");
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
                <span className="text-primary text-[10px] mt-1 select-none">●</span>
                <div className="flex-1">{renderInlineCitations(bulletContent)}</div>
              </div>
            );
          }

          return (
            <div key={lineIdx} className="my-0.5">
              {renderInlineCitations(line)}
            </div>
          );
        })}
      </div>
    );
  };

  const activePage = docDetail?.pages[currentPageIndex];

  return (
    <div className="flex-1 flex mt-12 h-[calc(100vh-48px)] overflow-hidden bg-background text-on-surface transition-colors">
      {/* Left Pane: PDF Document Viewer */}
      <section className="flex-1 border-r border-outline-variant flex flex-col relative overflow-hidden bg-surface-low">
        {/* PDF Toolbar */}
        <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <span className="font-label-mono text-label-mono text-slate-900 dark:text-slate-100 uppercase truncate max-w-[250px]">
              {selectedDoc ? selectedDoc.filename : "No Document Selected"}
            </span>
            {docDetail && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="material-symbols-outlined text-sm text-slate-900 dark:text-slate-100 hover:text-primary cursor-pointer disabled:opacity-30"
                  >
                    chevron_left
                  </button>
                  <span className="font-label-mono text-[12px] min-w-[70px] text-center text-slate-900 dark:text-slate-100">
                    Page {currentPageIndex + 1} / {docDetail.pages.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPageIndex((prev) =>
                        Math.min(docDetail.pages.length - 1, prev + 1)
                      )
                    }
                    disabled={currentPageIndex === docDetail.pages.length - 1}
                    className="material-symbols-outlined text-sm text-slate-900 dark:text-slate-100 hover:text-primary cursor-pointer disabled:opacity-30"
                  >
                    chevron_right
                  </button>
                </div>
              </>
            )}
          </div>

          {docDetail && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom((prev) => Math.max(50, prev - 25))}
                  className="material-symbols-outlined text-lg text-slate-900 dark:text-slate-100 hover:text-primary cursor-pointer"
                >
                  zoom_out
                </button>
                <span className="font-label-mono text-[12px] text-slate-900 dark:text-slate-100">{zoom}%</span>
                <button
                  onClick={() => setZoom((prev) => Math.min(200, prev + 25))}
                  className="material-symbols-outlined text-lg text-slate-900 dark:text-slate-100 hover:text-primary cursor-pointer"
                >
                  zoom_in
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="font-label-caps text-label-caps text-slate-600 dark:text-slate-400 group-hover:text-primary uppercase">
                  Highlight Chunks
                </span>
                <div
                  onClick={() => setHighlightChunks(!highlightChunks)}
                  className={`w-8 h-4 rounded-full relative transition-all ${
                    highlightChunks ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${
                      highlightChunks ? "right-1" : "left-1"
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* PDF Page Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center scroll-smooth bg-slate-100 dark:bg-slate-950 transition-colors">
          {isLoadingDoc ? (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                cyclone
              </span>
              <p className="text-body-sm italic">Loading document parser...</p>
            </div>
          ) : activePage ? (
            <div
              style={{ width: `${Math.min(98, zoom)}%`, maxWidth: "950px" }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative min-h-[600px] p-6 md:p-8 transition-all select-text rounded-lg w-full break-words"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h2 className="font-h2 text-lg text-slate-900 dark:text-slate-100 font-bold">
                  Document Content
                </h2>
                <span className="font-label-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold">
                  PAGE {activePage.page} • INDEXED
                </span>
              </div>

              <div className="space-y-4">
                {highlightChunks ? (
                  <div className="space-y-4">
                    {activePage.chunks.map((chunk, idx) => {
                      const isHighlighted = highlightedChunkText && (idx === 0 || chunk.text.includes(highlightedChunkText));
                      return (
                        <div
                          key={idx}
                          role="region"
                          tabIndex={0}
                          aria-label={`Document Chunk #${chunk.id}`}
                          className={`relative group border-l-4 p-4 pr-20 rounded-r-lg transition-all break-words shadow-sm focus:ring-2 focus:ring-primary/80 focus:outline-none ${
                            isHighlighted
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 border-y border-r border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/80 shadow-md"
                              : "border-indigo-600 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/90 border-y border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-500"
                          }`}
                        >
                          <div className="absolute -inset-1 bg-primary/5 rounded-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <p className={`text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap ${isHighlighted ? "text-amber-900 dark:text-amber-100 font-semibold" : "text-slate-800 dark:text-slate-100"}`}>
                            {chunk.text}
                          </p>
                          <div className="absolute right-3 top-3 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[9px] px-2 py-0.5 rounded font-label-mono opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm font-semibold">
                            CHUNK #{chunk.id}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-body-base leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                    {activePage.text}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-md gap-4 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-5xl text-primary/40">
                description
              </span>
              <div>
                <h3 className="font-h2 text-on-surface font-semibold mb-1">No Active Document</h3>
                <p className="text-body-sm text-on-surface-variant">
                  Select an indexed document from the left sidebar list or upload a PDF to inspect
                  its content pages.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Pane: AI Chatbot & Agent Activity Panel */}
      <section className="w-[440px] flex flex-col border-l border-outline-variant bg-surface-lowest">
        {/* Agent Activity Feed */}
        <div className="p-4 border-b border-outline-variant/60 bg-surface-low/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
              Agent Pipeline State
            </h3>
            {isSearching ? (
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-500"></span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div
              className={`flex items-center gap-1.5 font-label-mono text-[11px] px-2.5 py-1 rounded border transition-all ${
                currentTool === "retrieve_documents"
                  ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 animate-pulse font-bold"
                  : "bg-slate-200/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 opacity-80 font-medium"
              }`}
            >
              <span className="material-symbols-outlined text-sm">find_in_page</span>
              retrieve_chunks
            </div>
            <div
              className={`flex items-center gap-1.5 font-label-mono text-[11px] px-2.5 py-1 rounded border transition-all ${
                currentTool === "web_search (Tavily)"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 animate-pulse font-bold"
                  : "bg-slate-200/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 opacity-80 font-medium"
              }`}
            >
              <span className="material-symbols-outlined text-sm">language</span>
              web_search (Tavily)
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-[10px]">smart_toy</span>
                    </div>
                    <span className="font-label-caps text-[9px] text-primary uppercase font-bold tracking-wider">
                      Doc Assistant
                    </span>
                  </div>
                )}
                <div
                  className={`px-4 py-3 max-w-[90%] text-body-sm shadow-sm border ${
                    isUser
                      ? "bg-primary text-on-primary rounded-xl rounded-tr-none border-primary/20"
                      : "bg-surface-container text-on-surface rounded-xl rounded-tl-none border-outline-variant/30"
                  }`}
                >
                  {isUser ? msg.text : renderResponseText(msg.text)}
                </div>
                <span className="text-[9px] text-on-surface-variant/60 mt-1 px-1 font-label-mono uppercase">
                  {msg.timestamp} • {isUser ? "User" : "Agent"}
                </span>
              </div>
            );
          })}

          {isSearching && (
            <div className="flex items-center gap-3 opacity-80 pl-1 py-2">
              <div className="w-6 h-6 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant/30">
                <span className="material-symbols-outlined text-xs animate-spin text-primary">
                  cyclone
                </span>
              </div>
              <span className="text-[11px] font-label-mono text-on-surface-variant italic">
                Synthesizing document semantic chunks...
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Dock */}
        <div className="p-4 border-t border-outline-variant/60 bg-surface-low/30">
          {/* Suggested Quick Question Chips */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                const text = selectedDoc ? `Summarize ${selectedDoc.filename}` : "Summarize the uploaded document";
                setInputValue(text);
              }}
              className="text-[11px] bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Summarize
            </button>
            <button
              onClick={() => {
                setInputValue("Extract the key takeaways and technical skills");
              }}
              className="text-[11px] bg-indigo-500/15 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">key</span>
              Key Takeaways
            </button>
            <button
              onClick={() => {
                setInputValue("Search web for recent industry updates on this topic");
              }}
              className="text-[11px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">language</span>
              Web Search
            </button>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-[9px] font-label-caps text-on-surface-variant uppercase">
              Target Scope:
            </span>
            <select
              value={selectedDoc?.filename || "ALL"}
              onChange={(e) => {
                if (!setSelectedDoc) return;
                const val = e.target.value;
                if (val === "ALL") {
                  setSelectedDoc(null);
                } else {
                  const found = documents.find((d) => d.filename === val);
                  if (found) setSelectedDoc(found);
                }
              }}
              className="bg-surface-container border border-outline-variant px-2 py-0.5 rounded text-[10px] text-on-surface hover:border-primary transition-all cursor-pointer font-label-mono focus:outline-none"
            >
              <option value="ALL">All Documents</option>
              {documents.map((d, i) => (
                <option key={i} value={d.filename}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 pr-12 text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none min-h-[90px] max-h-[160px] resize-none placeholder-on-surface-variant/40"
              placeholder={
                selectedDoc
                  ? `Ask anything about ${selectedDoc.filename}...`
                  : "Ask a question about your indexed documents..."
              }
            />
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              <button
                onClick={() => {
                  let report = `# AI Document Assistant - Analysis Report\n`;
                  report += `Generated: ${new Date().toLocaleString()}\n`;
                  report += `Target Document: ${selectedDoc ? selectedDoc.filename : "All Documents"}\n\n---\n\n`;
                  chatHistory.forEach((msg) => {
                    report += `### ${msg.role === "user" ? "User" : "AI Assistant"} (${msg.timestamp})\n${msg.text}\n\n`;
                  });
                  const blob = new Blob([report], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `doc_analysis_report_${Date.now()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-1.5 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Export Analysis Report (.md)"
              >
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
              <button
                onClick={() => setChatHistory([chatHistory[0]])}
                className="p-1.5 text-on-surface-variant hover:text-error transition-all cursor-pointer"
                title="Reset conversation"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
              <button
                onClick={handleSend}
                disabled={isSearching || !inputValue.trim()}
                className="bg-primary text-on-primary w-8 h-8 rounded flex items-center justify-center shadow-md hover:bg-opacity-95 transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center text-[10px] text-on-surface-variant/60">
            <input
              type="file"
              ref={chatFileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0 && onUpload) {
                  await onUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">keyboard_command_key</span>{" "}
                Enter to send
              </span>
              <button
                onClick={() => chatFileInputRef.current?.click()}
                className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Attach PDF context document"
              >
                <span className="material-symbols-outlined text-[12px]">attach_file</span> Attach Context PDF
              </button>
            </div>
            <span className="font-label-mono">v2.4.0-stable</span>
          </div>
        </div>
      </section>

      {/* Floating Citation Excerpt Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: "fixed",
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 80}px`,
          }}
          className="bg-slate-800 shadow-2xl border border-slate-700 p-3 w-64 z-[999] rounded-lg text-slate-100 pointer-events-none"
        >
          <h4 className="font-label-caps text-[9px] text-primary mb-1 uppercase tracking-wider">
            Source Excerpt Preview
          </h4>
          <p className="text-[10px] leading-relaxed text-slate-300">
            {tooltip.text}
          </p>
          <div className="mt-2 pt-1 border-t border-slate-700 flex justify-between items-center">
            <span className="text-[8px] font-label-mono text-slate-400 uppercase">
              {tooltip.label}
            </span>
            <span className="text-primary text-[9px] font-bold">Go to page</span>
          </div>
        </div>
      )}
    </div>
  );
}
