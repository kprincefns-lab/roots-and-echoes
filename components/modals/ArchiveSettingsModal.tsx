"use client";

import { ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  HardDrive,
  RotateCcw,
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
  onClose: () => void;
  onImportArchive: (members: FamilyMember[]) => void;
  onResetArchive: () => void;
}

export function ArchiveSettingsModal({
  open,
  members,
  onClose,
  onImportArchive,
  onResetArchive,
}: ArchiveSettingsModalProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

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
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseImportedArchive(text);
      if (result.error || !result.members) {
        setStatusMessage(null);
        setErrorMessage(result.error ?? "Invalid archive file.");
        return;
      }
      onImportArchive(result.members);
      setErrorMessage(null);
      setStatusMessage(
        `Imported ${result.members.length} family members into the living archive.`
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    onResetArchive();
    setConfirmReset(false);
    setErrorMessage(null);
    setStatusMessage("Restored the original 14-member Vance–Moreau demo archive.");
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
              {/* Local Storage Stats */}
              <div className="flex items-center justify-between rounded-2xl border border-[#F5F2EB]/10 bg-[#0B110E]/75 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 text-[#E6C385]">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F5F2EB]">
                      Browser Archive Storage
                    </div>
                    <div className="text-[11px] text-[#A6A095]">
                      {members.length} members persisted locally
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#E6C385]">
                  ~{sizeKB} KB
                </span>
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
                  <Upload className="h-5 w-5 text-[#D4A359]" />
                  <div>
                    <div className="text-xs font-semibold text-[#F5F2EB]">
                      Import Archive (.json)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#A6A095]">
                      Restore a family backup file from another device
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/json,.json"
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
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Reset Demo Data */}
              <div className="flex items-center justify-between border-t border-[#F5F2EB]/10 pt-4">
                <div>
                  <p className="text-xs font-medium text-[#F5F2EB]">
                    Reset Demo Archive
                  </p>
                  <p className="text-[11px] text-[#A6A095]">
                    Restores the 14-member Vance–Moreau demo family
                  </p>
                </div>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F2EB]/15 px-3.5 py-1.5 text-xs text-[#A6A095] transition hover:border-red-400/45 hover:text-red-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded-full px-3 py-1.5 text-xs text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-full bg-red-500/85 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
