"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GitBranch,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

function GoogleMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function FamilyGate() {
  const [inviteCode, setInviteCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState<"invite" | "direct" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Surface OAuth callback denial messages cleanly (e.g. ?authError=invite_required)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("authError");
      if (authError === "invite_required") {
        setError(
          "Invite code required. Enter your Family Invite Code above before signing in with Google."
        );
        window.history.replaceState({}, "", "/");
      } else if (authError === "oauth_failed") {
        setError(
          "Google sign-in could not be completed. Please try again."
        );
        window.history.replaceState({}, "", "/");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const launchGoogleOAuth = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase authentication is not configured.");
      setLoading(null);
      return;
    }

    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthErr) {
      setError(oauthErr.message || "Unable to start Google sign-in.");
      setLoading(null);
    }
  };

  const handleContinueWithGoogle = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setError("Please enter your Family Invite Code first.");
      return;
    }

    setLoading("invite");
    setError(null);

    try {
      // Step 1: Validate Family Invite Code server-side & set HttpOnly cookie
      const res = await fetch("/api/auth/verify-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-family-code": cleanCode,
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Invalid Family Invite Code.");
        setLoading(null);
        return;
      }

      // Step 2: Launch Google OAuth -> redirects to /auth/callback
      await launchGoogleOAuth();
    } catch {
      setError("Network error while verifying your Family Invite Code.");
      setLoading(null);
    }
  };

  const handleReturningGoogleSignIn = async () => {
    if (loading) return;
    setLoading("direct");
    setError(null);
    await launchGoogleOAuth();
  };

  return (
    <main className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#090D0B] px-4 py-10">
      {/* Warm bioluminescent radial sanctuary glow */}
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
            Enter your Family Invite Code and sign in with Google to explore the
            3D Tree of Life.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleContinueWithGoogle(e)}
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

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading !== null || !inviteCode.trim()}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#F5F2EB] px-5 py-3 text-xs font-semibold tracking-wide text-[#090D0B] shadow-[0_10px_28px_rgba(212,163,89,0.28)] transition hover:bg-white disabled:opacity-45 cursor-pointer"
          >
            {loading === "invite" ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#090D0B]" />
            ) : (
              <GoogleMark />
            )}
            <span>
              {loading === "invite"
                ? "Verifying & Redirecting..."
                : "Continue with Google"}
            </span>
          </button>
        </form>

        {/* Returning relative shortcut (verified against family_members on /auth/callback) */}
        <div className="mt-4 text-center">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleReturningGoogleSignIn()}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#A6A095] transition hover:text-[#E6C385] disabled:opacity-40 cursor-pointer"
          >
            {loading === "direct" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-[#D4A359]" />
            )}
            <span>Already on the tree? Sign in directly with Google</span>
          </button>
        </div>

        <p className="mt-6 border-t border-[#F5F2EB]/8 pt-4 text-center text-[10.5px] leading-relaxed text-[#A6A095]/80">
          Profiles are private by default. Personal stories, photos, and health
          notes are only shared with verified relatives you approve.
        </p>
      </motion.div>
    </main>
  );
}
