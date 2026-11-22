"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Settings, Sparkles } from "lucide-react";
import {
  AccessRequestRecord,
  AccessRequestType,
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
  loadSavedCuratorCode,
  purgeLegacyLocalArchive,
  saveCuratorCode,
} from "@/lib/storage";
import { soundscape } from "@/lib/soundscape";
import { FamilyGate } from "@/components/auth/FamilyGate";
import { TreeViewport } from "@/components/tree/TreeViewport";
import { TopBar } from "@/components/hud/TopBar";
import { BottomControls } from "@/components/hud/BottomControls";
import { MemberDossier } from "@/components/dossier/MemberDossier";
import { AddMemberWizard } from "@/components/wizard/AddMemberWizard";
import { EditMemberModal } from "@/components/modals/EditMemberModal";
import { RequestsDrawer } from "@/components/modals/RequestsDrawer";
import { ArchiveSettingsModal } from "@/components/modals/ArchiveSettingsModal";

interface MutationResult {
  ok: boolean;
  error?: string;
}

export function RootsAndEchoesApp() {
  // Authentication state
  const [authChecked, setAuthChecked] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isCurator, setIsCurator] = useState(false);
  const [curatorCode, setCuratorCode] = useState("");

  // Tree & archive state
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Access requests state
  const [incomingRequests, setIncomingRequests] = useState<
    AccessRequestRecord[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    AccessRequestRecord[]
  >([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // UI & 3D state
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
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(true);

  useEffect(() => {
    return () => {
      soundscape.stopAmbient();
    };
  }, []);

  const buildAuthHeaders = useCallback(
    (overrideCuratorCode?: string): Record<string, string> => {
      const code = (overrideCuratorCode ?? curatorCode).trim();
      const headers: Record<string, string> = {};
      if (code) {
        headers["x-curator-code"] = code;
      }
      return headers;
    },
    [curatorCode]
  );

  const fetchRequests = useCallback(
    async (overrideCuratorCode?: string) => {
      try {
        const res = await fetch("/api/access-requests", {
          cache: "no-store",
          headers: buildAuthHeaders(overrideCuratorCode),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          incoming?: AccessRequestRecord[];
          outgoing?: AccessRequestRecord[];
          pendingCount?: number;
        };
        setIncomingRequests(data.incoming ?? []);
        setOutgoingRequests(data.outgoing ?? []);
        setPendingRequestsCount(data.pendingCount ?? 0);
      } catch {
        // Ignore transient badge refresh failures
      }
    },
    [buildAuthHeaders]
  );

  const fetchLiveArchive = useCallback(
    async (overrideCuratorCode?: string) => {
      setIsLoadingArchive(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/family", {
          cache: "no-store",
          headers: buildAuthHeaders(overrideCuratorCode),
        });
        if (res.status === 401) {
          setViewerEmail(null);
          setMembers([]);
          return;
        }
        const data = (await res.json()) as {
          members?: FamilyMember[];
          isCurator?: boolean;
          error?: string;
        };
        if (!res.ok) {
          setLoadError(data.error || "Unable to load family archive.");
          return;
        }
        setIsCurator(Boolean(data.isCurator));
        setMembers(
          Array.isArray(data.members) ? normalizeGenerations(data.members) : []
        );
      } catch {
        setLoadError("Network error while loading the family tree.");
      } finally {
        setIsLoadingArchive(false);
      }
    },
    [buildAuthHeaders]
  );

  // Initial session check on mount
  useEffect(() => {
    purgeLegacyLocalArchive();
    const frame = window.requestAnimationFrame(() => {
      const savedCurator = loadSavedCuratorCode();
      setCuratorCode(savedCurator);

      void fetch("/api/auth/session", {
        cache: "no-store",
        headers: savedCurator ? { "x-curator-code": savedCurator } : {},
      })
        .then((r) => r.json())
        .then(
          (data: {
            authenticated?: boolean;
            email?: string | null;
            isCurator?: boolean;
          }) => {
            if (data.authenticated && data.email) {
              setViewerEmail(data.email);
              setIsCurator(Boolean(data.isCurator));
              void fetchLiveArchive(savedCurator);
              void fetchRequests(savedCurator);
            } else {
              setViewerEmail(null);
            }
          }
        )
        .catch(() => {
          setViewerEmail(null);
        })
        .finally(() => {
          setAuthChecked(true);
        });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fetchLiveArchive, fetchRequests]);

  const handleCuratorCodeChange = useCallback(
    (code: string) => {
      setCuratorCode(code);
      saveCuratorCode(code);
      if (viewerEmail) {
        void fetchLiveArchive(code);
        void fetchRequests(code);
      }
    },
    [viewerEmail, fetchLiveArchive, fetchRequests]
  );

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    soundscape.stopAmbient();
    setAmbientPlaying(false);
    setViewerEmail(null);
    setIsCurator(false);
    setMembers([]);
    setSelectedMemberId(null);
    setSettingsOpen(false);
    setRequestsOpen(false);
  }, []);

  // Global Escape key closes open panels cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editingMember) {
        setEditingMember(null);
      } else if (wizardOpen) {
        setWizardOpen(false);
      } else if (requestsOpen) {
        setRequestsOpen(false);
      } else if (settingsOpen) {
        setSettingsOpen(false);
      } else if (selectedMemberId) {
        soundscape.playDrawerClose();
        setSelectedMemberId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingMember, wizardOpen, requestsOpen, settingsOpen, selectedMemberId]);

  const generations = useMemo(() => {
    const unique = Array.from(new Set(members.map((m) => m.generation)));
    return unique.sort((a, b) => a - b);
  }, [members]);

  const earliestYear = useMemo(() => {
    const validYears = members
      .map((m) => m.birthYear)
      .filter((y) => typeof y === "number" && y > 0);
    return validYears.length > 0
      ? Math.min(...validYears)
      : new Date().getFullYear();
  }, [members]);

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
        soundscape.playNodeSelect(
          target.generation,
          target.birthYear || 1980
        );
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

  // ─── CLOUD-FIRST MUTATIONS ──────────────────────────────────────────────────

  const handleCreateMember = useCallback(
    async (
      newMember: FamilyMember,
      linkTargetId: string,
      linkType: RelationshipLinkType
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({
            newMember,
            linkTargetId: linkTargetId || undefined,
            linkType,
          }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          createdId?: string;
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to save new member to Supabase.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }

        soundscape.playBranchPlanted();
        setSelectedMemberId(data.createdId || newMember.id);
        setShowOnboardingHint(false);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Network error while saving to Supabase.",
        };
      }
    },
    [buildAuthHeaders, fetchLiveArchive]
  );

  const handleSaveEdits = useCallback(
    async (
      memberId: string,
      updates: Partial<FamilyMember>
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({ memberId, updates }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to save profile edits.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while saving profile." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive]
  );

  const handleDeleteMember = useCallback(
    async (memberId: string): Promise<MutationResult> => {
      try {
        const res = await fetch(
          `/api/family?memberId=${encodeURIComponent(memberId)}`,
          {
            method: "DELETE",
            headers: buildAuthHeaders(),
          }
        );

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to delete profile.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        if (selectedMemberId === memberId) {
          setSelectedMemberId(null);
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while deleting profile." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive, selectedMemberId]
  );

  const handleAddMemoryPhoto = useCallback(
    async (memberId: string, photo: MemoryPhoto): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
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
            error: data.error || "Unable to upload memory photo.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while uploading photo." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive]
  );

  const handleUpdateSpiritAnimal = useCallback(
    async (
      memberId: string,
      animal: SpiritAnimalType | undefined
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
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
            error: data.error || "Unable to update spirit animal.",
          };
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
        return { ok: false, error: "Network error while updating spirit animal." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive]
  );

  const handleTogglePublicToFamily = useCallback(
    async (memberId: string, isPublic: boolean): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({ memberId, isPublicToFamily: isPublic }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          members?: FamilyMember[];
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to update profile visibility.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive();
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while updating visibility." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive]
  );

  const handleRequestAccess = useCallback(
    async (
      memberId: string,
      note: string,
      requestType: AccessRequestType
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/access-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({ memberId, note, requestType }),
        });

        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to send request.",
          };
        }

        await Promise.all([fetchLiveArchive(), fetchRequests()]);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while submitting request." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive, fetchRequests]
  );

  const handleRespondRequest = useCallback(
    async (
      requestId: string,
      decision: "approved" | "declined"
    ): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/access-requests", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({ requestId, decision }),
        });

        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to update request.",
          };
        }

        await Promise.all([fetchLiveArchive(), fetchRequests()]);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while updating request." };
      }
    },
    [buildAuthHeaders, fetchLiveArchive, fetchRequests]
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
            ...buildAuthHeaders(code),
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
          error: "Network error while importing archive.",
        };
      }
    },
    [buildAuthHeaders]
  );

  const handleClearArchive = useCallback(
    async (code: string): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "DELETE",
          headers: buildAuthHeaders(code),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };

        if (!res.ok) {
          return {
            ok: false,
            error: data.error || "Unable to clear tree in Supabase.",
          };
        }

        setMembers([]);
        setSelectedMemberId(null);
        setActiveGeneration(null);
        setResetSignal((n) => n + 1);
        await fetchRequests(code);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while clearing tree." };
      }
    },
    [buildAuthHeaders, fetchRequests]
  );

  const handleLoadDemoSeed = useCallback(
    async (code: string): Promise<MutationResult> => {
      try {
        const res = await fetch("/api/family", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(code),
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
            error: data.error || "Unable to load demo seed data.",
          };
        }

        if (Array.isArray(data.members)) {
          setMembers(normalizeGenerations(data.members));
        } else {
          await fetchLiveArchive(code);
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
    [buildAuthHeaders, fetchLiveArchive]
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

  // ─── AUTH GATE ──────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center bg-[#090D0B] text-[#F5F2EB]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4A359]/20 border-t-[#D4A359]" />
        <p className="mt-4 font-editorial text-2xl tracking-wide">
          Roots &amp; Echoes
        </p>
      </main>
    );
  }

  if (!viewerEmail) {
    return <FamilyGate />;
  }

  const viewerIsOnTree = members.some(
    (m) => m.ownerEmail?.toLowerCase() === viewerEmail.toLowerCase()
  );

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

      {/* Top Floating Search, Generation Filter, Layout Toggle & My Profiles / Requests */}
      <TopBar
        members={members}
        generations={generations}
        layoutMode={layoutMode}
        activeGeneration={activeGeneration}
        pendingRequestsCount={pendingRequestsCount}
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
        onOpenRequests={() => {
          void fetchRequests();
          setRequestsOpen(true);
        }}
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
                  Curator Settings
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
              Click any branch to view or request access · Toggle Ambiance for chamber strings
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

      {/* Slide-Over Glass Family Member Dossier (Private Request Gate or Full Dossier) */}
      <MemberDossier
        member={selectedMember}
        allMembers={members}
        viewerIsOnTree={viewerIsOnTree}
        onClose={handleClearSelection}
        onSelectMember={handleSelectMember}
        onAddMemoryPhoto={handleAddMemoryPhoto}
        onUpdateSpiritAnimal={handleUpdateSpiritAnimal}
        onTogglePublicToFamily={handleTogglePublicToFamily}
        onEditMember={(m) => setEditingMember(m)}
        onDeleteMember={handleDeleteMember}
        onRequestAccess={handleRequestAccess}
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

      {/* Creator / Curator Self-Edit Profile Modal */}
      {editingMember && (
        <EditMemberModal
          key={editingMember.id}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaveEdits={handleSaveEdits}
          onDeleteMember={handleDeleteMember}
        />
      )}

      {/* My Profiles & Incoming Access Requests Drawer */}
      <RequestsDrawer
        open={requestsOpen}
        viewerEmail={viewerEmail}
        isCurator={isCurator}
        members={members}
        incoming={incomingRequests}
        outgoing={outgoingRequests}
        onClose={() => setRequestsOpen(false)}
        onRespondRequest={handleRespondRequest}
        onSelectMember={handleSelectMember}
        onEditMember={(m) => setEditingMember(m)}
        onTogglePublicToFamily={handleTogglePublicToFamily}
      />

      {/* Account, Curator Override & Backup Settings Modal */}
      <ArchiveSettingsModal
        open={settingsOpen}
        viewerEmail={viewerEmail}
        isCurator={isCurator}
        members={members}
        curatorCode={curatorCode}
        onCuratorCodeChange={handleCuratorCodeChange}
        onClose={() => setSettingsOpen(false)}
        onSignOut={handleSignOut}
        onImportArchive={handleImportArchive}
        onClearArchive={handleClearArchive}
        onLoadDemoSeed={handleLoadDemoSeed}
      />
    </main>
  );
}
