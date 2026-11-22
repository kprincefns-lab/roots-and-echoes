"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Compass,
  GitBranch,
  Lock,
  Search,
  Settings,
  X,
} from "lucide-react";
import { FamilyMember, TreeLayoutMode } from "@/types/family";

interface TopBarProps {
  members: FamilyMember[];
  generations: number[];
  layoutMode: TreeLayoutMode;
  activeGeneration: number | null;
  pendingRequestsCount: number;
  onLayoutChange: (mode: TreeLayoutMode) => void;
  onGenerationChange: (gen: number | null) => void;
  onSelectMember: (id: string) => void;
  onOpenRequests: () => void;
  onOpenSettings: () => void;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export function TopBar({
  members,
  generations,
  layoutMode,
  activeGeneration,
  pendingRequestsCount,
  onLayoutChange,
  onGenerationChange,
  onSelectMember,
  onOpenRequests,
  onOpenSettings,
}: TopBarProps) {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses search, Escape blurs
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (
        e.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        inputRef.current?.blur();
        setSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return members.slice(0, 6);
    return members.filter((m) => {
      const isApproved = m.accessStatus === "approved";
      const haystack = isApproved
        ? `${m.firstName} ${m.lastName} ${m.maidenName ?? ""} ${m.occupation ?? ""} ${m.birthPlace ?? ""} ${m.birthYear}`.toLowerCase()
        : `${m.firstName} ${m.lastName}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [members, query]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col gap-2.5 px-4 pt-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand Wordmark */}
        <div className="pointer-events-auto glass-panel flex items-center gap-3 rounded-full px-4 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D4A359]/45 bg-[#D4A359]/15 text-[#E6C385]">
            <GitBranch className="h-3.5 w-3.5" />
          </span>
          <div className="leading-tight">
            <h1 className="font-editorial text-xl tracking-wide text-[#F5F2EB]">
              Roots &amp; Echoes
            </h1>
            <p className="hidden text-[9.5px] uppercase tracking-[0.22em] text-[#D4A359]/80 sm:block">
              Private Family Archive
            </p>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div className="pointer-events-auto relative order-3 w-full sm:order-2 sm:w-72 md:w-88">
          <div
            className={`glass-panel flex items-center gap-2 rounded-full px-3.5 py-2 transition ${
              searchFocused
                ? "border-[#D4A359]/55 shadow-[0_0_24px_rgba(212,163,89,0.2)]"
                : ""
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-[#D4A359]/80" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to a relative..."
              className="w-full bg-transparent text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/70 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-[#F5F2EB]/15 px-1.5 py-0.5 text-[10px] text-[#A6A095] sm:inline">
                /
              </kbd>
            )}
          </div>

          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="glass-panel-elevated archival-scroll absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl p-1.5"
              >
                {results.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-[#A6A095]">
                    No relatives match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  results.map((m) => {
                    const isLocked =
                      m.accessStatus === "locked" ||
                      m.accessStatus === "pending";
                    const initials =
                      `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelectMember(m.id);
                          setQuery("");
                          setSearchFocused(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#D4A359]/14 cursor-pointer"
                      >
                        {!isLocked && m.portraitUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.portraitUrl}
                            alt={m.firstName}
                            className="h-8 w-8 rounded-full border border-[#D4A359]/35 object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4A359]/30 bg-[#121B16] font-editorial text-xs text-[#E6C385]">
                            {initials}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-editorial text-base text-[#F5F2EB]">
                            {m.firstName} {m.lastName}
                          </div>
                          <div className="truncate text-[10.5px] text-[#A6A095]">
                            {!isLocked && m.birthYear > 0 ? (
                              <>
                                {m.birthYear}
                                {m.passingYear ? `–${m.passingYear}` : ""}
                                {m.occupation ? ` · ${m.occupation}` : ""}
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5 text-[#D4A359]" />
                                {m.accessStatus === "pending"
                                  ? "Access Requested"
                                  : "Private Profile"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#D4A359]/80">
                          Gen {ROMAN[m.generation] ?? m.generation + 1}
                        </span>
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layout Toggle + My Profiles & Requests + Archive Settings */}
        <div className="pointer-events-auto order-2 flex items-center gap-2 sm:order-3">
          <div className="glass-panel flex items-center rounded-full p-1">
            <button
              type="button"
              onClick={() => onLayoutChange("organic")}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition cursor-pointer ${
                layoutMode === "organic"
                  ? "text-[#090D0B]"
                  : "text-[#A6A095] hover:text-[#F5F2EB]"
              }`}
            >
              {layoutMode === "organic" && (
                <motion.span
                  layoutId="layout-toggle-pill"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[#D4A359]"
                />
              )}
              <GitBranch className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 hidden lg:inline">Organic Tree</span>
            </button>

            <button
              type="button"
              onClick={() => onLayoutChange("radial")}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition cursor-pointer ${
                layoutMode === "radial"
                  ? "text-[#090D0B]"
                  : "text-[#A6A095] hover:text-[#F5F2EB]"
              }`}
            >
              {layoutMode === "radial" && (
                <motion.span
                  layoutId="layout-toggle-pill"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[#D4A359]"
                />
              )}
              <Compass className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 hidden lg:inline">Radial Map</span>
            </button>
          </div>

          {/* My Profiles & Requests Button with Pending Count Badge */}
          <button
            type="button"
            onClick={onOpenRequests}
            title="My Profiles & Access Requests"
            className="glass-panel relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-medium text-[#F5F2EB] transition hover:border-[#D4A359]/45 hover:text-[#E6C385] cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5 text-[#D4A359]" />
            <span className="hidden md:inline">My Profiles &amp; Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#D4A359] px-1 text-[10px] font-bold text-[#090D0B]">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Archive Settings & Curator Controls"
            aria-label="Archive Settings"
            className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-[#A6A095] transition hover:border-[#D4A359]/45 hover:text-[#E6C385] cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Generation Filter Pill Bar */}
      {generations.length > 0 && (
        <div className="flex justify-center">
          <div className="pointer-events-auto glass-panel inline-flex items-center gap-1 rounded-full p-1">
            <button
              type="button"
              onClick={() => onGenerationChange(null)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                activeGeneration === null
                  ? "bg-[#D4A359]/22 text-[#E6C385]"
                  : "text-[#A6A095] hover:text-[#F5F2EB]"
              }`}
            >
              All Generations
            </button>
            {generations.map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() =>
                  onGenerationChange(activeGeneration === gen ? null : gen)
                }
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  activeGeneration === gen
                    ? "bg-[#D4A359] text-[#090D0B]"
                    : "text-[#A6A095] hover:text-[#F5F2EB]"
                }`}
              >
                Gen {ROMAN[gen] ?? gen + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
