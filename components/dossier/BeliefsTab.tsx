"use client";

import { Compass, Feather, Quote, Sparkles } from "lucide-react";
import { FamilyMember } from "@/types/family";

interface BeliefsTabProps {
  member: FamilyMember;
}

export function BeliefsTab({ member }: BeliefsTabProps) {
  const { beliefs } = member;

  return (
    <div className="space-y-6 pb-6">
      {/* Core Values */}
      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
          Core Values
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {beliefs.coreValues.map((value) => (
            <span
              key={value}
              className="rounded-full border border-[#D4A359]/28 bg-[#D4A359]/10 px-3 py-1 text-xs font-medium text-[#E6C385]"
            >
              {value}
            </span>
          ))}
        </div>
      </section>

      {/* Life Philosophy Pull-Quote */}
      <section className="rounded-2xl border border-[#D4A359]/22 bg-gradient-to-br from-[#16211B]/85 to-[#0D1410]/85 p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#D4A359]">
          <Compass className="h-3.5 w-3.5" />
          Life Philosophy
        </div>
        <blockquote className="mt-3 font-editorial text-2xl leading-[1.35] text-[#F5F2EB]">
          &ldquo;{beliefs.philosophy}&rdquo;
        </blockquote>
      </section>

      {/* Favorite Quotes */}
      {beliefs.favoriteQuotes.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
            <Quote className="h-3.5 w-3.5" />
            Words They Lived By
          </h3>
          <div className="mt-3 space-y-2.5">
            {beliefs.favoriteQuotes.map((q, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#F5F2EB]/8 bg-[#0B110E]/65 px-4 py-3 text-[13.5px] italic leading-relaxed text-[#F5F2EB]/88"
              >
                &ldquo;{q}&rdquo;
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spiritual & Cultural Beliefs */}
      <section>
        <h3 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
          <Sparkles className="h-3.5 w-3.5" />
          Cultural &amp; Spiritual Outlook
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#F5F2EB]/85">
          {beliefs.spiritualBeliefs}
        </p>
      </section>

      {/* Advice for Future Generations */}
      <section className="relative overflow-hidden rounded-2xl border border-[#E6C385]/30 bg-[#1B1710]/65 p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#E6C385]">
          <Feather className="h-3.5 w-3.5" />
          For Future Generations
        </div>
        <p className="mt-3 text-[14px] leading-[1.75] text-[#F5F2EB]/92">
          {beliefs.adviceForFuture}
        </p>
        <p className="mt-3 text-right font-editorial text-base italic text-[#D4A359]">
          — {member.firstName} {member.lastName}
        </p>
      </section>
    </div>
  );
}
