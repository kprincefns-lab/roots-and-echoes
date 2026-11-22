"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GitBranch,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface FamilyGateProps {
  onAuthenticated: (email: string) => void;
}

export function FamilyGate({ onAuthenticated }: FamilyGateProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-code": inviteCode.trim(),
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || "Unable to verify Family Invite Code.");
        return;
      }

      setInfoMessage(
        data.message || "We sent a 6-digit code and magic link to your email."
      );
      setStep(2);
    } catch {
      setError("Network error while contacting the family archive.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          token: otpToken.trim(),
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        email?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || "Invalid or expired verification code.");
        return;
      }

      onAuthenticated(data.email || email.trim().toLowerCase());
    } catch {
      setError("Network error while verifying code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#090D0B] px-4 py-10">
      {/* Subtle warm bioluminescent radial sanctuary glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 42%, rgba(212,163,89,0.12) 0%, rgba(14,21,17,0.4) 48%, rgba(5,8,6,0.96) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel-elevated relative z-10 w-full max-w-md overflow-hidden rounded-3xl p-7 sm:p-8"
      >
        {/* Crest & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#D4A359]/45 bg-[#D4A359]/14 text-[#E6C385] shadow-[0_0_30px_rgba(212,163,89,0.28)]">
            <GitBranch className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D4A359]">
            Private Living Family Archive
          </p>
          <h1 className="mt-1 font-editorial text-4xl tracking-wide text-[#F5F2EB]">
            Roots &amp; Echoes
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#A6A095]">
            {step === 1
              ? "Enter your Family Invite Code and email to verify your identity and enter the 3D Tree of Life."
              : `Enter the 6-digit verification code sent to ${email}, or click the Magic Link in your inbox.`}
          </p>
        </div>

        {/* Two-Step Progress Bar */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="h-1 rounded-full bg-[#D4A359]" />
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#E6C385]">
              1. Invite &amp; Email
            </span>
          </div>
          <div className="space-y-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                step === 2 ? "bg-[#D4A359]" : "bg-[#F5F2EB]/12"
              }`}
            />
            <span
              className={`block text-[10px] font-medium uppercase tracking-wider ${
                step === 2 ? "text-[#E6C385]" : "text-[#A6A095]/65"
              }`}
            >
              2. Verify Code
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="gate-step-1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              onSubmit={(e) => void handleRequestOtp(e)}
              className="mt-6 space-y-4"
            >
              <label className="block">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#E6C385]">
                  <KeyRound className="h-3.5 w-3.5" />
                  Family Invite Code
                </span>
                <div className="relative mt-1.5">
                  <input
                    type={showCode ? "text" : "password"}
                    required
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your Family Invite Code"
                    className="w-full rounded-xl border border-[#D4A359]/30 bg-[#090D0B]/85 pl-3.5 pr-10 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#E6C385] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    aria-label={showCode ? "Hide invite code" : "Show invite code"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6A095] hover:text-[#E6C385] cursor-pointer"
                  >
                    {showCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#E6C385]">
                  <Mail className="h-3.5 w-3.5" />
                  Your Email Address
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[#D4A359]/30 bg-[#090D0B]/85 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#E6C385] focus:outline-none"
                />
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !inviteCode.trim() || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4A359] px-5 py-3 text-xs font-semibold tracking-wide text-[#090D0B] shadow-[0_10px_28px_rgba(212,163,89,0.35)] transition hover:bg-[#E6C385] disabled:opacity-45 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {loading ? "Sending Verification Code..." : "Send Verification Code"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="gate-step-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              onSubmit={(e) => void handleVerifyOtp(e)}
              className="mt-6 space-y-4"
            >
              {infoMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <label className="block">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#E6C385]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  6-Digit Email Code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={otpToken}
                  onChange={(e) => {
                    setOtpToken(e.target.value);
                    setError(null);
                  }}
                  placeholder="000000"
                  className="mt-1.5 w-full rounded-xl border border-[#D4A359]/35 bg-[#090D0B]/85 px-4 py-3 text-center font-mono text-lg tracking-[0.38em] text-[#F5F2EB] placeholder:text-[#A6A095]/35 focus:border-[#E6C385] focus:outline-none"
                />
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpToken.trim().length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4A359] px-5 py-3 text-xs font-semibold tracking-wide text-[#090D0B] shadow-[0_10px_28px_rgba(212,163,89,0.35)] transition hover:bg-[#E6C385] disabled:opacity-45 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {loading ? "Verifying..." : "Verify & Enter Archive"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpToken("");
                  setError(null);
                }}
                className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs text-[#A6A095] transition hover:text-[#F5F2EB] cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different email or resend code
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 border-t border-[#F5F2EB]/8 pt-4 text-center text-[10.5px] leading-relaxed text-[#A6A095]/80">
          Profiles are private by default. Personal stories, photos, and health notes are only shared with relatives you approve.
        </p>
      </motion.div>
    </main>
  );
}
