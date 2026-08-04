"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 px-6 lg:px-16 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-white text-xl">description</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">AI Doc Assistant</span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-mono uppercase bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full">
            v2.4 Stable
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login?mode=login"
            className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-all"
          >
            Log In / Sign In
          </Link>
          <Link
            href="/login?mode=register"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Register</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 lg:px-16 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono mb-8 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>Powered by Qdrant, Llama-3.1 & Tavily Web Search</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
          Unlock Deep Intelligence From{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Your Documents
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-10">
          Upload PDFs, generate vector embeddings in real time, and chat with a ReAct AI agent that provides exact page citations and live internet search.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:opacity-95 text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>Start Analyzing Documents</span>
            <span className="material-symbols-outlined text-xl">rocket_launch</span>
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto border border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-white font-semibold text-base px-7 py-4 rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Architecture</span>
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </a>
        </div>

        {/* Tech Stack Badges */}
        <div className="pt-6 border-t border-slate-800/80 w-full max-w-4xl flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-base">database</span>
            <span>Qdrant Vector DB</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-base">psychology</span>
            <span>Llama-3.1-8B ReAct Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-400 text-base">language</span>
            <span>Tavily Web Search</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">lock</span>
            <span>Neon PostgreSQL & OAuth</span>
          </div>
        </div>
      </section>

      {/* Interactive App Mock Preview */}
      <section className="px-6 lg:px-16 max-w-6xl mx-auto mb-28 w-full">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl relative">
          <div className="h-10 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-500">http://localhost:3000 • Workspace</span>
            <div className="w-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Left sidebar preview */}
            <div className="md:col-span-3 border-r border-slate-800 p-4 bg-slate-950/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                  Indexed Documents
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-blue-600/15 border border-blue-500/40 text-white text-xs font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">description</span>
                    <span className="truncate">Sneha_Gupta_Resume.pdf</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500 text-base">description</span>
                    <span className="truncate">market_analysis.pdf</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/60 text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Qdrant Connected</span>
              </div>
            </div>

            {/* Middle Document Content Preview */}
            <div className="md:col-span-5 border-r border-slate-800 p-6 bg-slate-900/40">
              <div className="text-xs font-mono text-slate-400 mb-2">PAGE 1 • INDEXED</div>
              <h3 className="font-bold text-white text-base mb-3 border-b border-slate-800 pb-2">
                Document Content Excerpt
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed space-y-2">
                Software Engineering student with experience in Full-Stack Web Development, RAG AI Architecture, and Cloud Systems. Skilled in Next.js, Python, PostgreSQL, and Qdrant Vector Search.
              </p>
            </div>

            {/* Right Chatbot Preview */}
            <div className="md:col-span-4 p-4 bg-slate-950/60 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  <span>AI Doc Assistant</span>
                </div>
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 leading-relaxed shadow-sm">
                  Here are the key qualifications retrieved from <b>Sneha_Gupta_Resume.pdf</b>:
                  <br /><br />
                  • <b>Specialization:</b> Software Engineering & Full-Stack Development
                  <br />
                  • <b>Tech Stack:</b> Next.js, Python, Qdrant, PostgreSQL
                  <br /><br />
                  <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                    [Sneha_Gupta_Resume.pdf • Page 1]
                  </span>
                </div>
              </div>

              <div className="mt-4 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-500 flex justify-between items-center">
                <span>Ask anything about doc...</span>
                <span className="material-symbols-outlined text-blue-400 text-base">send</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="px-6 lg:px-16 max-w-6xl mx-auto mb-28 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Built for Modern Document Workflows
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            From semantic vector retrieval to automatic citation hover previews, everything is engineered for high utility and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">find_in_page</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Qdrant Vector Retrieval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              PDFs are chunked page-by-page and converted into 384-dimensional dense vector embeddings using SentenceTransformers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ReAct AI Reasoning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LangChain ReAct agent powered by Groq Llama-3.1 synthesizes answers with interactive click-to-navigate page citations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-all group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">language</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tavily Live Web Search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When documents don't contain the answer, the agent seamlessly queries live web data via Tavily Search API.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-6 lg:px-16 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <span className="text-slate-300 font-semibold">AI Doc Assistant</span>
          </div>
          <div>© {new Date().getFullYear()} AI Doc Assistant. All rights reserved.</div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/login" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
