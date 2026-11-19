"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FamilyMember,
  MemoryPhoto,
  RelationshipLinkType,
  SpiritAnimalType,
  TreeLayoutMode,
} from "@/types/family";
import { SEED_FAMILY } from "@/data/seedFamily";
import {
  getDirectLineageIds,
  normalizeGenerations,
} from "@/lib/lineage";
import {
  loadFamilyArchive,
  resetFamilyArchive,
  saveFamilyArchive,
} from "@/lib/storage";
import { soundscape } from "@/lib/soundscape";
import { TreeViewport } from "@/components/tree/TreeViewport";
import { TopBar } from "@/components/hud/TopBar";
import { BottomControls } from "@/components/hud/BottomControls";
import { MemberDossier } from "@/components/dossier/MemberDossier";
import { AddMemberWizard } from "@/components/wizard/AddMemberWizard";
import { ArchiveSettingsModal } from "@/components/modals/ArchiveSettingsModal";

export function RootsAndEchoesApp() {
  const [members, setMembers] = useState<FamilyMember[]>(SEED_FAMILY);
  const [hydrated, setHydrated] = useState(false);

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

  // Stop ambient audio gracefully on unmount
  useEffect(() => {
    return () => {
      soundscape.stopAmbient();
    };
  }, []);

  // Hydrate persisted archive from localStorage after mount (SSR-safe)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMembers(loadFamilyArchive());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    if (!hydrated) return;
    saveFamilyArchive(members);
  }, [members, hydrated]);

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
    () => Math.min(...members.map((m) => m.birthYear)),
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

  const handleAddMemoryPhoto = useCallback(
    (memberId: string, photo: MemoryPhoto) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, gallery: [photo, ...m.gallery] } : m
        )
      );
    },
    []
  );

  const handleUpdateSpiritAnimal = useCallback(
    (memberId: string, animal: SpiritAnimalType | undefined) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, spiritAnimal: animal } : m
        )
      );
      if (animal) {
        soundscape.playBranchPlanted();
      }
    },
    []
  );

  const handleCreateMember = useCallback(
    (
      newMember: FamilyMember,
      linkTargetId: string,
      linkType: RelationshipLinkType
    ) => {
      setMembers((prev) => {
        const target = prev.find((m) => m.id === linkTargetId);
        if (!target) {
          return normalizeGenerations([...prev, newMember]);
        }

        const linkedNew: FamilyMember = { ...newMember };
        const updated = prev.map((existing) => {
          if (existing.id !== linkTargetId) {
            // If adding a child of target, also link target's primary partner as co-parent
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

        return normalizeGenerations([...updated, linkedNew]);
      });

      // Celebratory harp arpeggio & fly straight to the newly added family member
      soundscape.playBranchPlanted();
      setSelectedMemberId(newMember.id);
      setShowOnboardingHint(false);
    },
    []
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

  const handleImportArchive = useCallback((imported: FamilyMember[]) => {
    setMembers(normalizeGenerations(imported));
    setSelectedMemberId(null);
    setActiveGeneration(null);
    setResetSignal((n) => n + 1);
  }, []);

  const handleResetArchive = useCallback(() => {
    const fresh = resetFamilyArchive();
    setMembers(fresh);
    setSelectedMemberId(null);
    setActiveGeneration(null);
    setResetSignal((n) => n + 1);
  }, []);

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

      {/* Gentle First-Visit Interaction Hint */}
      <AnimatePresence>
        {showOnboardingHint && !selectedMemberId && (
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
        onClose={() => setWizardOpen(false)}
        onCreateMember={handleCreateMember}
      />

      {/* Export / Import Backup & Settings Modal */}
      <ArchiveSettingsModal
        open={settingsOpen}
        members={members}
        onClose={() => setSettingsOpen(false)}
        onImportArchive={handleImportArchive}
        onResetArchive={handleResetArchive}
      />
    </main>
  );
}
