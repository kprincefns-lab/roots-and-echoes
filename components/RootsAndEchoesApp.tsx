"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Settings, Sparkles } from "lucide-react";
import {
  FamilyMember,
  MemoryPhoto,
  RelationshipLinkType,
  SpiritAnimalType,
  TreeLayoutMode,
} from "@/types/family";
import {
  getDirectLineageIds,
  normalizeGenerations,
} from "@/lib/lineage";
import {
  loadSavedFamilyCode,
  purgeLegacyLocalArchive,
  saveFamilyCode,
} from "@/lib/storage";
import { soundscape } from "@/lib/soundscape";
import { TreeViewport } from "@/components/tree/TreeViewport";
import { TopBar } from "@/components/hud/TopBar";
import { BottomControls } from "@/components/hud/BottomControls";
import { MemberDossier } from "@/components/dossier/MemberDossier";
import { AddMemberWizard } from "@/components/wizard/AddMemberWizard";
import { ArchiveSettingsModal } from "@/components/modals/ArchiveSettingsModal";

interface MutationResult {
  ok: boolean;
  error?: string;
}

export function RootsAndEchoesApp() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [layoutMode, setLayoutMode] = useState<TreeLayoutMode>("organic");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeGeneration, setActiveGeneration] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);

  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.62);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSession, setWizardSession] = useState(0);
  const [wizardLinkedId, setWizardLinkedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(true);

  const [storageSource, setStorageSource] = useState<"supabase" | "local">(
    "supabase"
  );
  const [inviteRequired, setInviteRequired] = useState(true);
  const [accessCode, setAccessCode] = useState("");

  // Stop ambient audio gracefully on unmount
  useEffect(() => {
    return () => {
      soundscape.stopAmbient();
    };
  }, []);

  // Load live authoritative tree from GET /api/family (no localStorage caching of members)
  const fetchLiveArchive = useCallback(async () => {
    setIsLoadingArchive(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/family", { cache: "no-store" });
      const data = (await res.json()) as {
        members?: FamilyMember[];
        source?: "supabase" | "local";
        inviteRequired?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setLoadError(data.error || "Unable to load family archive from Supabase.");
        return;
      }
      setStorageSource(data.source === "local" ? "local" : "supabase");
      setInviteRequired(Boolean(data.inviteRequired));
      setMembers(
        Array.isArray(data.members) ? normalizeGenerations(data.members) : []
      );
    } catch {
      setLoadError("Network error while loading the family tree.");
    } finally {
      setIsLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    purgeLegacyLocalArchive();
    const frame = window.requestAnimationFrame(() => {
      setAccessCode(loadSavedFamilyCode());
      void fetchLiveArchive();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fetchLiveArchive]);

  const handleAccessCodeChange = useCallback((code: string) => {
    setAccessCode(code);
    saveFamilyCode(code);
  }, []);

  // Global Escape key closes open panels cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (wizardOpen) {
        setWizardOpen(false);
      } else if (settingsOpen) {
        setSettingsOpen(false);
      } else if (selectedMemberId) {
        soundscape.playDrawerClose();
        setSelectedMemberId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [wizardOpen, settingsOpen, selectedMemberId]);

  const generations = useMemo(() => {
    const unique = Array.from(new Set(members.map((m) => m.generation)));
    return unique.sort((a, b) => a - b);
  }, [members]);

  const earliestYear = useMemo(
    () =>
      members.length > 0
        ? Math.min(...members.map((m) => m.birthYear))
        : new Date().getFullYear(),
    [members]
  );

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const directLineageIds = useMemo(
    () => getDirectLineageIds(selectedMemberId, members),
    [selectedMemberId, members]
  );

  const handleToggleAmbient = useCallback(() => {
    if (soundscape.isAmbientPlaying()) {
      soundscape.stopAmbient();
      setAmbientPlaying(false);
    } else {
      soundscape.startAmbient();
      setAmbientPlaying(true);
    }
  }, []);

  const handleToggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      soundscape.setSfxEnabled(next);
      return next;
    });
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setAudioVolume(vol);
    soundscape.setVolume(vol);
  }, []);

  const handleSelectMember = useCallback(
    (id: string) => {
      const target = members.find((m) => m.id === id);
      if (target) {
        soundscape.playNodeSelect(target.generation, target.birthYear);
      }
      setSelectedMemberId(id);
      setActiveGeneration(null);
      setShowOnboardingHint(false);
    },
    [members]
  );

  const handleClearSelection = useCallback(() => {
    soundscape.playDrawerClose();
    setSelectedMemberId(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedMemberId(null);
    setActiveGeneration(null);
    setResetSignal((n) => n + 1);
  }, []);

  // ─── CLOUD-FIRST MUTATIONS (ALWAYS CONFIRMED BY /api/family) ────────────────

  const handleAddMemoryPhoto = useCallback(
    async (
      memberId: string,
      photo: MemoryPhoto,
      familyCode: string
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-family-code": familyCode,
          },
          body: JSON.stringify({ memberId, addMemoryPhoto: photo }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to save memory photo to Supabase.",
          };
        }

        if (familyCode.trim()) {
          handleAccessCodeChange(familyCode);
        }
        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while uploading memory photo. Please try again.",
        };
      }
    },
    [handleAccessCodeChange, fetchLiveArchive]
  );

  const handleUpdateSpiritAnimal = useCallback(
    async (
      memberId: string,
      animal: SpiritAnimalType | undefined,
      familyCode: string
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-family-code": familyCode,
          },
          body: JSON.stringify({ memberId, spiritAnimal: animal ?? null }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to update spirit animal in Supabase.",
          };
        }

        if (familyCode.trim()) {
          handleAccessCodeChange(familyCode);
        }
        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        if (animal) {
          soundscape.playBranchPlanted();
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while updating spirit animal. Please try again.",
        };
      }
    },
    [handleAccessCodeChange, fetchLiveArchive]
  );

  const handleCreateMember = useCallback(
    async (
      newMember: FamilyMember,
      linkTargetId: string,
      linkType: RelationshipLinkType,
      familyCode: string
    ): Promise<MutationResult> => {
      // Build the linked snapshot from the current confirmed members array
      const target = members.find((m) => m.id === linkTargetId);
      let nextSnapshot: FamilyMember[];

      if (!target) {
        nextSnapshot = normalizeGenerations([...members, newMember]);
      } else {
        const linkedNew: FamilyMember = { ...newMember };
        const updated = members.map((existing) => {
          if (existing.id !== linkTargetId) {
            if (
              linkType === "child" &&
              target.partnerIds.includes(existing.id)
            ) {
              linkedNew.parentIds = Array.from(
                new Set([...linkedNew.parentIds, existing.id])
              );
              return {
                ...existing,
                childrenIds: Array.from(
                  new Set([...existing.childrenIds, linkedNew.id])
                ),
              };
            }
            return existing;
          }

          if (linkType === "child") {
            linkedNew.parentIds = Array.from(
              new Set([...linkedNew.parentIds, existing.id])
            );
            return {
              ...existing,
              childrenIds: Array.from(
                new Set([...existing.childrenIds, linkedNew.id])
              ),
            };
          }

          if (linkType === "partner") {
            linkedNew.partnerIds = [existing.id];
            return {
              ...existing,
              partnerIds: Array.from(
                new Set([...existing.partnerIds, linkedNew.id])
              ),
            };
          }

          // linkType === "parent"
          linkedNew.childrenIds = [existing.id];
          return {
            ...existing,
            parentIds: Array.from(
              new Set([...existing.parentIds, linkedNew.id])
            ),
          };
        });

        nextSnapshot = normalizeGenerations([...updated, linkedNew]);
      }

      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-family-code": familyCode,
          },
          body: JSON.stringify({ members: nextSnapshot }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to save new member to Supabase.",
          };
        }

        if (familyCode.trim()) {
          handleAccessCodeChange(familyCode);
        }
        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }

        soundscape.playBranchPlanted();
        setSelectedMemberId(newMember.id);
        setShowOnboardingHint(false);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while saving to Supabase. Please check your connection and try again.",
        };
      }
    },
    [members, handleAccessCodeChange, fetchLiveArchive]
  );

  const handleImportArchive = useCallback(
    async (
      imported: FamilyMember[],
      code: string
    ): Promise<MutationResult> => {
      const normalized = normalizeGenerations(imported);
      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-family-code": code,
          },
          body: JSON.stringify({ members: normalized, replaceAll: true }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to import archive to Supabase.",
          };
        }

        if (code.trim()) {
          handleAccessCodeChange(code);
        }
        setMembers(
          Array.isArray(data.members)
            ? normalizeGenerations(data.members)
            : normalized
        );
        setSelectedMemberId(null);
        setActiveGeneration(null);
        setResetSignal((n) => n + 1);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while importing archive to Supabase.",
        };
      }
    },
    [handleAccessCodeChange]
  );

  const handleClearArchive = useCallback(
    async (code: string): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "DELETE",
          headers: {
            "x-family-code": code,
          },
        });
        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to clear tree in Supabase.",
          };
        }

        if (code.trim()) {
          handleAccessCodeChange(code);
        }
        setMembers([]);
        setSelectedMemberId(null);
        setActiveGeneration(null);
        setResetSignal((n) => n + 1);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while clearing the cloud tree.",
        };
      }
    },
    [handleAccessCodeChange]
  );

  const handleLoadDemoSeed = useCallback(
    async (code: string): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-family-code": code,
          },
          body: JSON.stringify({ action: "seed-demo" }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to load demo seed data into Supabase.",
          };
        }

        if (code.trim()) {
          handleAccessCodeChange(code);
        }
        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        setSelectedMemberId(null);
        setActiveGeneration(null);
        setResetSignal((n) => n + 1);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while loading demo seed data.",
        };
      }
    },
    [handleAccessCodeChange, fetchLiveArchive]
  );

  const handleQuickAddRelative = useCallback((memberId: string) => {
    setWizardLinkedId(memberId);
    setWizardSession((n) => n + 1);
    setWizardOpen(true);
  }, []);

  const handleOpenWizardDefault = useCallback(() => {
    setWizardLinkedId(selectedMemberId);
    setWizardSession((n) => n + 1);
    setWizardOpen(true);
  }, [selectedMemberId]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#090D0B]">
      {/* 3D WebGL Tree of Life */}
      <TreeViewport
        members={members}
        layoutMode={layoutMode}
        selectedMemberId={selectedMemberId}
        activeGeneration={activeGeneration}
        autoRotate={autoRotate}
        resetSignal={resetSignal}
        onSelectMember={handleSelectMember}
        onClearSelection={handleClearSelection}
      />

      {/* Subtle ambient archival vignette overlay */}
      <div className="archival-vignette pointer-events-none fixed inset-0 z-10" />

      {/* Top Floating Search, Generation Filter & Layout Toggle */}
      <TopBar
        members={members}
        generations={generations}
        layoutMode={layoutMode}
        activeGeneration={activeGeneration}
        onLayoutChange={(mode) => {
          soundscape.playLayoutShift(mode);
          setLayoutMode(mode);
          setShowOnboardingHint(false);
        }}
        onGenerationChange={(gen) => {
          setActiveGeneration(gen);
          if (gen !== null) setSelectedMemberId(null);
        }}
        onSelectMember={handleSelectMember}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Load Error Banner */}
      <AnimatePresence>
        {loadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-28 left-1/2 z-40 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={() => void fetchLiveArchive()}
              className="glass-panel-elevated rounded-full border border-red-400/45 px-4 py-2 text-xs text-red-200 shadow-xl cursor-pointer"
            >
              {loadError} · Click to retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty Sanctuary Overlay (shown after Curator clears the tree) */}
      <AnimatePresence>
        {!isLoadingArchive && !loadError && members.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="pointer-events-auto fixed left-1/2 top-1/2 z-20 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="glass-panel-elevated rounded-3xl p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#D4A359]/40 bg-[#D4A359]/12 text-[#E6C385]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-editorial text-3xl text-[#F5F2EB]">
                Your Living Tree Awaits
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#A6A095]">
                The cloud archive is empty and ready for your family&rsquo;s real story. Plant your first founding ancestor, or load the 14-member demo family from Settings.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenWizardDefault}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A359] px-5 py-2.5 text-xs font-semibold text-[#090D0B] shadow-[0_8px_24px_rgba(212,163,89,0.35)] transition hover:bg-[#E6C385] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Plant First Ancestor
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/30 bg-[#0B110E]/75 px-4 py-2.5 text-xs font-medium text-[#E6C385] transition hover:bg-[#D4A359]/15 cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Load Demo / Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gentle First-Visit Interaction Hint */}
      <AnimatePresence>
        {showOnboardingHint && !selectedMemberId && members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-20 -translate-x-1/2"
          >
            <div className="glass-panel rounded-full px-4 py-1.5 text-[11px] tracking-wide text-[#F5F2EB]/80 whitespace-nowrap">
              Click any glowing node to open their dossier · Toggle Ambiance for chamber strings
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Camera Controls, Chamber Audio, Lineage Spotlight & "+ Add to the Tree" FAB */}
      <BottomControls
        memberCount={members.length}
        generationCount={generations.length}
        earliestYear={earliestYear}
        selectedMember={selectedMember}
        lineageCount={directLineageIds.size}
        autoRotate={autoRotate}
        ambientPlaying={ambientPlaying}
        sfxEnabled={sfxEnabled}
        audioVolume={audioVolume}
        onToggleAutoRotate={() => setAutoRotate((v) => !v)}
        onToggleAmbient={handleToggleAmbient}
        onToggleSfx={handleToggleSfx}
        onVolumeChange={handleVolumeChange}
        onResetCamera={handleResetCamera}
        onClearSelection={handleClearSelection}
        onOpenWizard={handleOpenWizardDefault}
      />

      {/* Slide-Over Glass Family Member Dossier */}
      <MemberDossier
        member={selectedMember}
        allMembers={members}
        inviteRequired={inviteRequired}
        savedFamilyCode={accessCode}
        onClose={handleClearSelection}
        onSelectMember={handleSelectMember}
        onAddMemoryPhoto={handleAddMemoryPhoto}
        onUpdateSpiritAnimal={handleUpdateSpiritAnimal}
        onQuickAddRelative={handleQuickAddRelative}
      />

      {/* Guided 3-Step Contribution & Media Upload Wizard */}
      <AddMemberWizard
        key={wizardSession}
        open={wizardOpen}
        existingMembers={members}
        initialLinkedMemberId={wizardLinkedId}
        inviteRequired={inviteRequired}
        savedFamilyCode={accessCode}
        onClose={() => setWizardOpen(false)}
        onCreateMember={handleCreateMember}
      />

      {/* Export / Import Backup & Curator Settings Modal */}
      <ArchiveSettingsModal
        open={settingsOpen}
        members={members}
        storageSource={storageSource}
        accessCode={accessCode}
        onAccessCodeChange={handleAccessCodeChange}
        onClose={() => setSettingsOpen(false)}
        onImportArchive={handleImportArchive}
        onClearArchive={handleClearArchive}
        onLoadDemoSeed={handleLoadDemoSeed}
      />
    </main>
  );
}
