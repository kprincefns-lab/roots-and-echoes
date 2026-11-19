"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Droplets,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { FamilyMember } from "@/types/family";

interface HealthGeneticsTabProps {
  member: FamilyMember;
}

export function HealthGeneticsTab({ member }: HealthGeneticsTabProps) {
  const [revealed, setRevealed] = useState(false);
  const { health } = member;

  return (
    <div className="pb-6">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#D4A359]/22 bg-[#0C130F]/80 px-6 py-12 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4A359]/35 bg-[#D4A359]/10 text-[#E6C385]">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-editorial text-2xl text-[#F5F2EB]">
              Sensitive Health &amp; Hereditary Log
            </h3>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#A6A095]">
              Contains personal medical history, longevity observations, and
              genetic notes preserved for {member.firstName}&rsquo;s descendants.
            </p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D4A359]/45 bg-[#D4A359]/15 px-5 py-2.5 text-xs font-semibold tracking-wide text-[#E6C385] transition hover:bg-[#D4A359]/25 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              Sensitive Health Info — Click to Reveal
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between rounded-xl border border-[#D4A359]/20 bg-[#D4A359]/8 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs text-[#E6C385]">
                <ShieldCheck className="h-4 w-4" />
                <span>Private Hereditary Record Unlocked</span>
              </div>
              <button
                type="button"
                onClick={() => setRevealed(false)}
                className="inline-flex items-center gap-1 text-[11px] text-[#A6A095] transition hover:text-[#F5F2EB] cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Conceal
              </button>
            </div>

            {/* Key Vital Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#0B110E]/75 p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#D4A359]">
                  <Droplets className="h-3.5 w-3.5" />
                  Blood Type
                </div>
                <div className="mt-1.5 font-editorial text-2xl text-[#F5F2EB]">
                  {health.bloodType || "Not Recorded"}
                </div>
              </div>
              <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#0B110E]/75 p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#D4A359]">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Recorded Conditions
                </div>
                <div className="mt-1.5 font-editorial text-2xl text-[#F5F2EB]">
                  {health.knownConditions.length}
                </div>
              </div>
            </div>

            {/* Longevity Notes */}
            <section className="rounded-xl border border-[#F5F2EB]/8 bg-[#0B110E]/60 p-4">
              <h4 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#D4A359]">
                <Activity className="h-3.5 w-3.5" />
                Longevity &amp; Vitality
              </h4>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#F5F2EB]/88">
                {health.longevityNotes}
              </p>
            </section>

            {/* Known Genetic / Medical Conditions */}
            <section>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#D4A359]">
                Known Genetic &amp; Medical Notes
              </h4>
              <ul className="mt-2.5 space-y-2">
                {health.knownConditions.map((cond, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-[#F5F2EB]/8 bg-[#0B110E]/60 px-3.5 py-2.5 text-xs leading-relaxed text-[#F5F2EB]/88"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A359]" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Lifestyle & Daily Habits */}
            <section>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#D4A359]">
                Lifestyle &amp; Daily Habits
              </h4>
              <p className="mt-2 text-[13px] leading-relaxed text-[#A6A095]">
                {health.lifestyleNotes}
              </p>
            </section>

            {/* Guidance for Descendants */}
            <section className="rounded-xl border border-[#D4A359]/25 bg-[#161D17]/75 p-4">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#E6C385]">
                Guidance for Descendants
              </h4>
              <p className="mt-2 text-[13px] leading-relaxed text-[#F5F2EB]/90">
                {health.hereditaryGuidance}
              </p>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
