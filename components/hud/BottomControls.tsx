"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { FamilyMember } from "@/types/family";

interface BottomControlsProps {
  memberCount: number;
  generationCount: number;
  earliestYear: number;
  selectedMember: FamilyMember | null;
  lineageCount: number;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
  onClearSelection: () => void;
  onOpenWizard: () => void;
}

export function BottomControls({
  memberCount,
  generationCount,
  earliestYear,
  selectedMember,
  lineageCount,
  autoRotate,
  onToggleAutoRotate,
  onResetCamera,
  onClearSelection,
  onOpenWizard,
}: BottomControlsProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-4 pb-5 sm:px-6">
      {/* Left: Camera & Archive Info Pill */}
      <div className="pointer-events-auto glass-panel flex items-center gap-1.5 rounded-full p-1.5">
        <button
          type="button"
          onClick={onResetCamera}
          title="Reset camera view"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] text-[#F5F2EB]/85 transition hover:bg-[#D4A359]/15 hover:text-[#E6C385] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#D4A359]" />
          <span className="hidden sm:inline">Reset View</span>
        </button>

        <div className="h-4 w-px bg-[#D4A359]/20" />

        <button
          type="button"
          onClick={onToggleAutoRotate}
          title={autoRotate ? "Pause gentle orbit" : "Resume gentle orbit"}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] text-[#F5F2EB]/85 transition hover:bg-[#D4A359]/15 hover:text-[#E6C385] cursor-pointer"
        >
          {autoRotate ? (
            <Pause className="h-3.5 w-3.5 text-[#D4A359]" />
          ) : (
            <Play className="h-3.5 w-3.5 text-[#D4A359]" />
          )}
          <span className="hidden sm:inline">
            {autoRotate ? "Orbiting" : "Orbit"}
          </span>
        </button>

        <div className="hidden h-4 w-px bg-[#D4A359]/20 md:block" />

        <span className="hidden px-3 text-[11px] tracking-wide text-[#A6A095] md:inline">
          {memberCount} Souls · {generationCount} Generations · {earliestYear}–Present
        </span>
      </div>

      {/* Center: Lineage Spotlight Banner */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto glass-panel hidden items-center gap-2.5 rounded-full px-4 py-2 text-xs text-[#F5F2EB] lg:flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E6C385]" />
            <span>
              Illuminating direct lineage of{" "}
              <strong className="font-semibold text-[#E6C385]">
                {selectedMember.firstName} {selectedMember.lastName}
              </strong>{" "}
              <span className="text-[#A6A095]">
                ({lineageCount} connected)
              </span>
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Clear lineage highlight"
              className="ml-1 rounded-full p-0.5 text-[#A6A095] transition hover:bg-[#F5F2EB]/10 hover:text-[#F5F2EB] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Floating Action Button "+ Add to the Tree" */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onOpenWizard}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#D4A359] px-5 py-3 text-xs font-semibold tracking-wide text-[#090D0B] shadow-[0_10px_32px_rgba(212,163,89,0.42)] transition hover:bg-[#E6C385] cursor-pointer"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Add to the Tree</span>
      </motion.button>
    </div>
  );
}
