"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { FamilyMember } from "@/types/family";

interface BottomControlsProps {
  memberCount: number;
  generationCount: number;
  earliestYear: number;
  selectedMember: FamilyMember | null;
  lineageCount: number;
  autoRotate: boolean;
  ambientPlaying: boolean;
  sfxEnabled: boolean;
  audioVolume: number;
  onToggleAutoRotate: () => void;
  onToggleAmbient: () => void;
  onToggleSfx: () => void;
  onVolumeChange: (vol: number) => void;
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
  ambientPlaying,
  sfxEnabled,
  audioVolume,
  onToggleAutoRotate,
  onToggleAmbient,
  onToggleSfx,
  onVolumeChange,
  onResetCamera,
  onClearSelection,
  onOpenWizard,
}: BottomControlsProps) {
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-4 pb-5 sm:px-6">
      {/* Left: Camera, Chamber Audio & Archive Info Pill */}
      <div className="pointer-events-auto relative flex items-center gap-2">
        {/* Audio Mixer Popover */}
        <AnimatePresence>
          {audioMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="glass-panel-elevated absolute bottom-14 left-0 w-64 rounded-2xl p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#D4A359]">
                  Chamber Acoustics
                </span>
                <button
                  type="button"
                  onClick={() => setAudioMenuOpen(false)}
                  aria-label="Close audio settings"
                  className="text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Ambient Violin & Cello Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#F5F2EB]">
                    Violin &amp; Cello Score
                  </div>
                  <div className="text-[10.5px] text-[#A6A095]">
                    Hall reverb · D Major
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleAmbient}
                  className={`relative h-5 w-9 rounded-full transition cursor-pointer ${
                    ambientPlaying ? "bg-[#D4A359]" : "bg-[#F5F2EB]/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#090D0B] transition-all ${
                      ambientPlaying ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Branch Click Key Chimes Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#F5F2EB]">
                    Branch Key Chimes
                  </div>
                  <div className="text-[10.5px] text-[#A6A095]">
                    Harmonic node resonance
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleSfx}
                  className={`relative h-5 w-9 rounded-full transition cursor-pointer ${
                    sfxEnabled ? "bg-[#D4A359]" : "bg-[#F5F2EB]/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#090D0B] transition-all ${
                      sfxEnabled ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-1.5 pt-1 border-t border-[#F5F2EB]/10">
                <div className="flex items-center justify-between text-[11px] text-[#A6A095]">
                  <span className="inline-flex items-center gap-1.5">
                    {audioVolume === 0 ? (
                      <VolumeX className="h-3.5 w-3.5 text-[#D4A359]" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-[#D4A359]" />
                    )}
                    Master Volume
                  </span>
                  <span className="text-[#E6C385]">
                    {Math.round(audioVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audioVolume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full accent-[#D4A359] cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Left Control Pill */}
        <div className="glass-panel flex items-center gap-1 rounded-full p-1.5">
          {/* Chamber Audio Play / Mute Button */}
          <button
            type="button"
            onClick={onToggleAmbient}
            title={
              ambientPlaying
                ? "Pause violin & cello ambiance"
                : "Play violin & cello ambiance"
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] transition cursor-pointer ${
              ambientPlaying
                ? "bg-[#D4A359]/22 text-[#E6C385]"
                : "text-[#F5F2EB]/85 hover:bg-[#D4A359]/15 hover:text-[#E6C385]"
            }`}
          >
            {ambientPlaying ? (
              <span className="flex h-3.5 items-end gap-[2px] px-0.5">
                <span className="h-2 w-[2px] animate-pulse rounded-full bg-[#E6C385]" />
                <span className="h-3.5 w-[2px] animate-pulse rounded-full bg-[#E6C385] [animation-delay:150ms]" />
                <span className="h-2.5 w-[2px] animate-pulse rounded-full bg-[#E6C385] [animation-delay:300ms]" />
              </span>
            ) : (
              <Music className="h-3.5 w-3.5 text-[#D4A359]" />
            )}
            <span className="hidden sm:inline">
              {ambientPlaying ? "Strings On" : "Ambiance"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAudioMenuOpen((v) => !v)}
            title="Audio mixer & chimes settings"
            aria-label="Audio settings"
            className={`flex h-7 w-7 items-center justify-center rounded-full transition cursor-pointer ${
              audioMenuOpen
                ? "bg-[#D4A359]/20 text-[#E6C385]"
                : "text-[#A6A095] hover:bg-[#D4A359]/12 hover:text-[#E6C385]"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
          </button>

          <div className="h-4 w-px bg-[#D4A359]/20" />

          <button
            type="button"
            onClick={onResetCamera}
            title="Reset camera view"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] text-[#F5F2EB]/85 transition hover:bg-[#D4A359]/15 hover:text-[#E6C385] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#D4A359]" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <div className="h-4 w-px bg-[#D4A359]/20" />

          <button
            type="button"
            onClick={onToggleAutoRotate}
            title={autoRotate ? "Pause gentle orbit" : "Resume gentle orbit"}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] text-[#F5F2EB]/85 transition hover:bg-[#D4A359]/15 hover:text-[#E6C385] cursor-pointer"
          >
            {autoRotate ? (
              <Pause className="h-3.5 w-3.5 text-[#D4A359]" />
            ) : (
              <Play className="h-3.5 w-3.5 text-[#D4A359]" />
            )}
            <span className="hidden md:inline">
              {autoRotate ? "Orbiting" : "Orbit"}
            </span>
          </button>

          <div className="hidden h-4 w-px bg-[#D4A359]/20 xl:block" />

          <span className="hidden px-3 text-[11px] tracking-wide text-[#A6A095] xl:inline">
            {memberCount} Souls · {generationCount} Generations · {earliestYear}–Present
          </span>
        </div>
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
