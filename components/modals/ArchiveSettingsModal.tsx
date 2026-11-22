"use client";

import { ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Download,
  HardDrive,
  KeyRound,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FamilyMember } from "@/types/family";
import {
  buildArchiveExport,
  estimateArchiveSizeKB,
  parseImportedArchive,
} from "@/lib/storage";

interface ArchiveSettingsModalProps {
  open: boolean;
  members: FamilyMember[];
  storageSource: "supabase" | "local";
  accessCode: string;
  onAccessCodeChange: (code: string) => void;
  onClose: () => void;
  onImportArchive: (
    members: FamilyMember[],
    code: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onClearArchive: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onLoadDemoSeed: (code: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ArchiveSettingsModal({
  open,
  members,
  storageSource,
  accessCode,
  onAccessCodeChange,
  onClose,
  onImportArchive,
  onClearArchive,
  onLoadDemoSeed,
}: ArchiveSettingsModalProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busyAction, setBusyAction] = useState<
    "import" | "clear" | "seed" | null
  >(null);

  const sizeKB = estimateArchiveSizeKB(members);

  const handleExport = () => {
    const payload = buildArchiveExport(members);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `roots-and-echoes-archive-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setErrorMessage(null);
    setStatusMessage(`Exported ${members.length} family records as JSON.`);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseImportedArchive(text);
      if (result.error || !result.members) {
        setStatusMessage(null);
        setErrorMessage(result.error ?? "Invalid archive file.");
        return;
      }

      setBusyAction("import");
      setStatusMessage(null);
      setErrorMessage(null);
      const res = await onImportArchive(result.members, accessCode);
      setBusyAction(null);

      if (!res.ok) {
        setErrorMessage(
          res.error || "Failed to import archive to Supabase."
        );
        return;
      }
      setStatusMessage(
        `Imported ${result.members.length} family members into the cloud archive.`
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClear = async () => {
    setBusyAction("clear");
    setStatusMessage(null);
    setErrorMessage(null);
    const res = await onClearArchive(accessCode);
    setBusyAction(null);

    if (!res.ok) {
      setErrorMessage(res.error || "Failed to clear cloud tree.");
      return;
    }

    setConfirmClear(false);
    setStatusMessage(
      "Cleared all members from Supabase. Your tree is now empty and ready for your real family."
    );
  };

  const handleSeedDemo = async () => {
    setBusyAction("seed");
    setStatusMessage(null);
    setErrorMessage(null);
    const res = await onLoadDemoSeed(accessCode);
    setBusyAction(null);

    if (!res.ok) {
      setErrorMessage(res.error || "Failed to load demo seed data.");
      return;
    }

    setStatusMessage(
      "Loaded the 14-member Vance–Moreau demo archive into Supabase."
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated w-full max-w-lg overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-[#D4A359]/18 px-6 py-5">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#D4A359]">
                  Archive Stewardship
                </p>
                <h2 className="mt-0.5 font-editorial text-3xl text-[#F5F2EB]">
                  Backup &amp; Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] transition hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Storage Backend Status */}
              <div className="flex items-center justify-between rounded-2xl border border-[#F5F2EB]/10 bg-[#0B110E]/75 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 text-[#E6C385]">
                    {storageSource === "supabase" ? (
                      <Cloud className="h-4 w-4" />
                    ) : (
                      <HardDrive className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F5F2EB]">
                      {storageSource === "supabase"
                        ? "Supabase Cloud Archive Connected"
                        : "Local Demo Mode"}
                    </div>
                    <div className="text-[11px] text-[#A6A095]">
                      {members.length} members live across all devices
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#E6C385]">
                  ~{sizeKB} KB
                </span>
              </div>

              {/* Family Invite / Curator Code */}
              <div className="rounded-2xl border border-[#D4A359]/22 bg-[#0B110E]/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#E6C385]">
                    <KeyRound className="h-3.5 w-3.5" />
                    Family Invite or Admin Curator Code
                  </label>
                  {accessCode && (
                    <button
                      type="button"
                      onClick={() => onAccessCodeChange("")}
                      className="text-[10.5px] text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                    >
                      Clear saved
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => {
                    onAccessCodeChange(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter Family Invite Code or Admin Curator Code..."
                  className="w-full rounded-xl border border-[#D4A359]/25 bg-[#090D0B] px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/55 focus:border-[#E6C385] focus:outline-none"
                />
                <p className="text-[10.5px] text-[#A6A095]">
                  Cached on this device for adding relatives, photos, and spirit animals. Clearing the tree or importing backups requires the Admin Curator Code.
                </p>
              </div>

              {/* Export & Import Actions */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-[#D4A359]/30 bg-[#D4A359]/10 p-4 text-left transition hover:bg-[#D4A359]/18 cursor-pointer"
                >
                  <Download className="h-5 w-5 text-[#E6C385]" />
                  <div>
                    <div className="text-xs font-semibold text-[#F5F2EB]">
                      Export Archive (.json)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#A6A095]">
                      Download a shareable backup with all stories &amp; photos
                    </div>
                  </div>
                </button>

                <label className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-[#F5F2EB]/14 bg-[#0B110E]/70 p-4 text-left transition hover:border-[#D4A359]/45">
                  {busyAction === "import" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#D4A359]" />
                  ) : (
                    <Upload className="h-5 w-5 text-[#D4A359]" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-[#F5F2EB]">
                      Import Archive (.json)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#A6A095]">
                      Overwrite cloud tree from a JSON backup (Curator)
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/json,.json"
                    disabled={busyAction !== null}
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Curator Controls: Clear Tree & Load Demo Seed Data */}
              <div className="space-y-3 border-t border-[#F5F2EB]/10 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#F5F2EB]">
                      Reset / Clear Tree
                    </p>
                    <p className="text-[11px] text-[#A6A095]">
                      Permanently deletes all members from Supabase so you can start fresh
                    </p>
                  </div>

                  {!confirmClear ? (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => setConfirmClear(true)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F5F2EB]/15 px-3.5 py-1.5 text-xs text-[#A6A095] transition hover:border-red-400/45 hover:text-red-300 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear Tree
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="rounded-full px-3 py-1.5 text-xs text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() => void handleClear()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/85 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                      >
                        {busyAction === "clear" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Confirm Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#F5F2EB]">
                      Load Demo Seed Data
                    </p>
                    <p className="text-[11px] text-[#A6A095]">
                      Populates Supabase with the 14-member Vance–Moreau sample family
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void handleSeedDemo()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D4A359]/35 bg-[#D4A359]/10 px-3.5 py-1.5 text-xs font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 disabled:opacity-40 cursor-pointer"
                  >
                    {busyAction === "seed" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Load Demo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
