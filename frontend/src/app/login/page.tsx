"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  sendOTP,
  verifyOTP,
  sendMagicLink,
  getGoogleAuthURL,
  registerWithPassword,
  loginWithPassword,
  requestPasswordReset,
  resetPasswordWithCode,
} from "@/lib/auth";

type AuthMethod = "password" | "google" | "otp" | "magic-link";
type OTPStep = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [method, setMethod] = useState<AuthMethod>("password");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState<OTPStep>("email");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialMode = params.get("mode");
      if (initialMode === "register" || initialMode === "login") {
        setAuthMode(initialMode);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthURL();
  };

  const handleSendOTP = async () => {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true);
    setError(null);
    const result = await sendOTP(email);
    setLoading(false);
    if (result.success) {
      setOtpStep("code");
      setSuccess("OTP sent! Check your email (or server console in dev mode)");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(result.message || "Failed to send OTP");
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (value && index === 5 && newDigits.every(d => d)) {
      handleVerifyOTP(newDigits.join(""));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setLoading(true);
    setError(null);
    const result = await verifyOTP(email, code);
    setLoading(false);
    if (result.success && result.token) {
      await login(result.token);
      router.replace("/");
    } else {
      setError(result.message || "Invalid OTP");
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handlePasswordAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    if (authMode === "register" && !name) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    setError(null);

    let result;
    if (authMode === "register") {
      result = await registerWithPassword(name, email, password);
    } else {
      result = await loginWithPassword(email, password);
    }

    setLoading(false);

    if (result.success && result.token) {
      await login(result.token);
      router.replace("/");
    } else {
      setError(result.message || "Authentication failed");
    }
  };

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (result.success) {
      setForgotStep("verify");
      setSuccess("Password reset code sent! Check your email (or server console in dev mode)");
    } else {
      setError(result.message || "Failed to send reset code");
    }
  };

  const handleConfirmReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !resetCode || !newPassword) {
      setError("Please enter email, reset code, and new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await resetPasswordWithCode(email, resetCode, newPassword);
    setLoading(false);
    if (result.success) {
      setIsForgotPassword(false);
      setAuthMode("login");
      setMethod("password");
      setPassword(newPassword);
      setSuccess("Password reset successfully! You can now log in.");
    } else {
      setError(result.message || "Failed to reset password");
    }
  };

  const handleSendMagicLink = async () => {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true);
    setError(null);
    const result = await sendMagicLink(email);
    setLoading(false);
    if (result.success) {
      setMagicLinkSent(true);
      setSuccess("Magic link sent! Check your email (or server console in dev mode)");
    } else {
      setError(result.message || "Failed to send magic link");
    }
  };

  const resetState = () => {
    setOtpStep("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setMagicLinkSent(false);
    setError(null);
    setSuccess(null);
  };

  const switchMethod = (m: AuthMethod) => {
    setMethod(m);
    resetState();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1117" }}>
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
      }}
    >
      {/* Subtle background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(56,139,253,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative w-full max-w-md"
        style={{
          background: "rgba(22,27,34,0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(48,54,61,0.8)",
          borderRadius: "16px",
          boxShadow:
            "0 0 0 1px rgba(56,139,253,0.1), 0 16px 48px rgba(0,0,0,0.4), 0 0 80px rgba(56,139,253,0.05)",
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#58a6ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#e6edf3" }}
            >
              AI Doc Assistant
            </span>
          </div>

          {/* Mode Switcher Pills: Log In vs Register */}
          <div
            className="flex rounded-lg p-1 max-w-[260px] mx-auto mb-3"
            style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(48,54,61,0.6)" }}
          >
            <button
              onClick={() => { setAuthMode("login"); resetState(); }}
              className="flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer"
              style={{
                background: authMode === "login" ? "#388bfd" : "transparent",
                color: authMode === "login" ? "#ffffff" : "#8b949e",
              }}
            >
              Log In
            </button>
            <button
              onClick={() => { setAuthMode("register"); resetState(); }}
              className="flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer"
              style={{
                background: authMode === "register" ? "#388bfd" : "transparent",
                color: authMode === "register" ? "#ffffff" : "#8b949e",
              }}
            >
              Register / Sign Up
            </button>
          </div>

          <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
            {authMode === "login" ? "Welcome Back!" : "Create your Account"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#8b949e" }}>
            {authMode === "login"
              ? "Sign in to access your indexed documents"
              : "Register to analyze documents with AI vector RAG"}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            className="mx-8 mb-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "rgba(248,81,73,0.1)",
              border: "1px solid rgba(248,81,73,0.4)",
              color: "#f85149",
            }}
          >
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}
        {success && (
          <div
            className="mx-8 mb-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
            style={{
              background: "rgba(63,185,80,0.1)",
              border: "1px solid rgba(63,185,80,0.4)",
              color: "#3fb950",
            }}
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {success}
          </div>
        )}

        {/* Method Tabs */}
        <div className="px-8 mb-6">
          <div
            className="flex rounded-lg p-1 gap-1"
            style={{ background: "rgba(13,17,23,0.6)" }}
          >
            {[
              { key: "password" as AuthMethod, label: "Password", icon: "lock" },
              { key: "google" as AuthMethod, label: "Google", icon: "public" },
              { key: "otp" as AuthMethod, label: "OTP", icon: "pin" },
              { key: "magic-link" as AuthMethod, label: "Magic Link", icon: "link" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchMethod(tab.key)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: method === tab.key ? "rgba(56,139,253,0.15)" : "transparent",
                  color: method === tab.key ? "#58a6ff" : "#8b949e",
                  border: method === tab.key ? "1px solid rgba(56,139,253,0.3)" : "1px solid transparent",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {/* Forgot Password View */}
          {isForgotPassword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-400 text-base">lock_reset</span>
                  Reset Password
                </span>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setError(null); }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              {forgotStep === "request" ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#c9d1d9" }}>
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        background: "rgba(13,17,23,0.6)",
                        border: "1px solid rgba(48,54,61,0.8)",
                        color: "#e6edf3",
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #388bfd 0%, #58a6ff 100%)",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? "Sending Reset Code..." : "Send Password Reset Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Reset code sent to <strong className="text-blue-400">{email}</strong>
                  </p>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#c9d1d9" }}>
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        background: "rgba(13,17,23,0.6)",
                        border: "1px solid rgba(48,54,61,0.8)",
                        color: "#e6edf3",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#c9d1d9" }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        background: "rgba(13,17,23,0.6)",
                        border: "1px solid rgba(48,54,61,0.8)",
                        color: "#e6edf3",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #388bfd 0%, #58a6ff 100%)",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? "Resetting Password..." : "Update & Reset Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("request")}
                    className="w-full text-xs text-blue-400 hover:underline text-center cursor-pointer"
                  >
                    ← Send code again
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Password Form */}
              {method === "password" && (
                <form onSubmit={handlePasswordAuth} className="space-y-4">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#c9d1d9" }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Pranjal Shukla"
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{
                          background: "rgba(13,17,23,0.6)",
                          border: "1px solid rgba(48,54,61,0.8)",
                          color: "#e6edf3",
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#c9d1d9" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        background: "rgba(13,17,23,0.6)",
                        border: "1px solid rgba(48,54,61,0.8)",
                        color: "#e6edf3",
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: "#c9d1d9" }}>
                        Password
                      </label>
                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => { setIsForgotPassword(true); setForgotStep("request"); setError(null); }}
                          className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={{
                        background: "rgba(13,17,23,0.6)",
                        border: "1px solid rgba(48,54,61,0.8)",
                        color: "#e6edf3",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #388bfd 0%, #58a6ff 100%)",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {authMode === "register" ? "Creating Account..." : "Logging In..."}
                      </span>
                    ) : authMode === "register" ? (
                      "Create Account & Register"
                    ) : (
                      "Log In"
                    )}
                  </button>
                </form>
              )}
              {/* Google */}
              {method === "google" && (
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "#ffffff",
                      color: "#1f2937",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                  </button>
                  <p className="text-center text-xs" style={{ color: "#8b949e" }}>
                    We&apos;ll use your Google account name and profile picture
                  </p>
                </div>
              )}

              {/* Email OTP */}
              {method === "otp" && (
                <div className="space-y-4">
                  {otpStep === "email" ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: "#c9d1d9" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                          style={{
                            background: "rgba(13,17,23,0.6)",
                            border: "1px solid rgba(48,54,61,0.8)",
                            color: "#e6edf3",
                          }}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg, #388bfd 0%, #58a6ff 100%)",
                          color: "#ffffff",
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          "Send OTP Code"
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-center mb-4" style={{ color: "#c9d1d9" }}>
                        Enter the 6-digit code sent to <strong style={{ color: "#58a6ff" }}>{email}</strong>
                      </p>
                      <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOTPChange(i, e.target.value)}
                            onKeyDown={(e) => handleOTPKeyDown(i, e)}
                            className="w-12 h-14 text-center text-xl font-bold rounded-lg outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/50"
                            style={{
                              background: "rgba(13,17,23,0.6)",
                              border: `1px solid ${digit ? "rgba(56,139,253,0.5)" : "rgba(48,54,61,0.8)"}`,
                              color: "#e6edf3",
                            }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => { setOtpStep("email"); setOtpDigits(["", "", "", "", "", ""]); }}
                        className="w-full mt-2 text-xs text-center transition-colors duration-200"
                        style={{ color: "#58a6ff" }}
                      >
                        ← Use a different email
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Magic Link */}
              {method === "magic-link" && (
                <div className="space-y-4">
                  {!magicLinkSent ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: "#c9d1d9" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
                          style={{
                            background: "rgba(13,17,23,0.6)",
                            border: "1px solid rgba(48,54,61,0.8)",
                            color: "#e6edf3",
                          }}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleSendMagicLink}
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg, #388bfd 0%, #58a6ff 100%)",
                          color: "#ffffff",
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          "Send Magic Link"
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-3 py-4">
                      <div
                        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                        style={{ background: "rgba(63,185,80,0.15)" }}
                      >
                        <span className="material-symbols-outlined text-3xl" style={{ color: "#3fb950" }}>
                          mark_email_read
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
                        Check your inbox!
                      </p>
                      <p className="text-xs" style={{ color: "#8b949e" }}>
                        We sent a magic link to <strong style={{ color: "#58a6ff" }}>{email}</strong>
                      </p>
                      <button
                        onClick={() => { setMagicLinkSent(false); }}
                        className="text-xs transition-colors duration-200"
                        style={{ color: "#58a6ff" }}
                      >
                        Didn&apos;t receive it? Send again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Divider & Switch Mode Link */}
          <div className="mt-6 pt-4 text-center space-y-2" style={{ borderTop: "1px solid rgba(48,54,61,0.6)" }}>
            {authMode === "login" ? (
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setAuthMode("register"); resetState(); }}
                  className="font-bold text-blue-400 hover:underline cursor-pointer"
                >
                  Register / Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Already registered?{" "}
                <button
                  onClick={() => { setAuthMode("login"); resetState(); }}
                  className="font-bold text-blue-400 hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </p>
            )}
            <p className="text-[11px]" style={{ color: "#484f58" }}>
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
