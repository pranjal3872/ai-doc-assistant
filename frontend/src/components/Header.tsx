"use client";

import React, { useState, useRef, useEffect } from "react";
import { User } from "@/lib/auth";

interface HeaderProps {
  currentView: "workspace" | "document_hub";
  setView: (view: "workspace" | "document_hub") => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onNewSession: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function Header({
  currentView,
  setView,
  darkMode,
  setDarkMode,
  onNewSession,
  user,
  onLogout,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    }
    if (showUserMenu || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);

  const getInitials = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-6 ml-sidebar z-40 transition-colors">
      <nav className="flex gap-6 h-full items-center">
        <button
          onClick={() => setView("workspace")}
          className={`font-label-caps text-xs uppercase tracking-wider transition-all h-full flex items-center gap-2 cursor-pointer px-1 ${
            currentView === "workspace"
              ? "text-primary border-b-2 border-primary font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-primary font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          Workspace
        </button>
        <button
          onClick={() => setView("document_hub")}
          className={`font-label-caps text-xs uppercase tracking-wider transition-all h-full flex items-center gap-2 cursor-pointer px-1 ${
            currentView === "document_hub"
              ? "text-primary border-b-2 border-primary font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-primary font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          Document Hub
        </button>
      </nav>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative group">
          <input
            className="bg-surface-container-low border border-outline-variant px-4 py-1.5 rounded-full text-body-sm w-64 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder-on-surface-variant/50"
            placeholder="Search across docs..."
            type="text"
          />
          <span className="material-symbols-outlined absolute right-3 top-1.5 text-on-surface-variant text-sm">
            search
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* New Session */}
        <button
          onClick={onNewSession}
          className="bg-primary text-on-primary font-label-caps text-[10px] px-4 py-1.5 rounded hover:opacity-90 active:scale-95 transition-all uppercase font-bold"
        >
          New Session
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 border-l border-outline-variant pl-4" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-on-surface-variant hover:text-primary transition-all p-1 relative cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 top-10 w-80 rounded-xl shadow-2xl overflow-hidden z-50 p-4 text-xs text-slate-200"
                style={{
                  background: "rgba(22,27,34,0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(48,54,61,0.8)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-white text-sm">System Notifications</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full font-mono">
                      All Systems Operational
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                      title="Close"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
                <div className="py-3 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-green-400 text-base">database</span>
                    <div>
                      <p className="font-semibold text-slate-200">Qdrant Vector DB</p>
                      <p className="text-[11px] text-slate-400">Local collection initialized & ready for document embeddings.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-blue-400 text-base">psychology</span>
                    <div>
                      <p className="font-semibold text-slate-200">Groq LLM Engine</p>
                      <p className="text-[11px] text-slate-400">llama-3.1-8b-instant active (500k TPD high speed limit).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-400 text-base">language</span>
                    <div>
                      <p className="font-semibold text-slate-200">Tavily Web Search</p>
                      <p className="text-[11px] text-slate-400">API Key configured for live internet search queries.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center border border-outline-variant overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            >
              {user?.profilePic ? (
                <img
                  className="w-full h-full object-cover"
                  alt="User Avatar"
                  src={user.profilePic}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {getInitials()}
                </span>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 top-10 w-64 rounded-xl shadow-2xl overflow-hidden z-50"
                style={{
                  background: "rgba(22,27,34,0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(48,54,61,0.8)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: "rgba(48,54,61,0.6)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-outline-variant flex items-center justify-center bg-surface-container-high">
                      {user?.profilePic ? (
                        <img
                          className="w-full h-full object-cover"
                          alt="User Avatar"
                          src={user.profilePic}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-base font-bold text-primary">
                          {getInitials()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      {user?.name && (
                        <p className="text-sm font-semibold truncate" style={{ color: "#e6edf3" }}>
                          {user.name}
                        </p>
                      )}
                      <p className="text-xs truncate" style={{ color: "#8b949e" }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200 hover:bg-red-500/10"
                    style={{ color: "#f85149" }}
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
