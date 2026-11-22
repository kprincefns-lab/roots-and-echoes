"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Link2,
  Loader2,
  Lock,
  Search,
  X,
} from "lucide-react";
import { FamilyMember, RelationshipLinkType } from "@/types/family";
import { getGenerationLabel } from "@/lib/lineage";

interface ConnectRelativeModalProps {
  sourceMember: FamilyMember | null;
  allMembers: FamilyMember[];
  onClose: () => void;
  onConnect: (
    sourceId: string,
    targetId: string,
    relationship: RelationshipLinkType
  ) => Promise<{ ok: boolean; error?: string }>;
}

const RELATIONSHIP_OPTIONS: Array<{
  value: RelationshipLinkType;
  label: string;
  hint: string;
}> = [
  {
    value: "parent",
    label: "Parent",
    hint: "Places above as mother/father",
  },
  {
    value: "child",
    label: "Child",
    hint: "Places below as son/daughter",
  },
  {
    value: "brother",
    label: "Brother",
    hint: "Shares parents & links as sibling",
  },
  {
    value: "sister",
    label: "Sister",
    hint: "Shares parents & links as sibling",
  },
  {
    value: "partner",
    label: "Partner",
    hint: "Joins side-by-side with golden vine",
  },
];

function getExistingRelationLabel(
  source: FamilyMember,
  candidate: FamilyMember
): string | null {
  if (source.parentIds.includes(candidate.id)) return "Parent";
  if (source.childrenIds.includes(candidate.id)) return "Child";
  if (source.partnerIds.includes(candidate.id)) return "Partner";
  const sharedParent =
    source.parentIds.length > 0 &&
    candidate.parentIds.some((pid) => source.parentIds.includes(pid));
  const explicitSibling =
    Boolean(source.siblingIds?.includes(candidate.id)) ||
    Boolean(candidate.siblingIds?.includes(source.id));
  if (sharedParent || explicitSibling) return "Sibling";
  return null;
}

export function ConnectRelativeModal({
  sourceMember,
  allMembers,
  onClose,
  onConnect,
}: ConnectRelativeModalProps) {
  const [relationship, setRelationship] =
    useState<RelationshipLinkType>("brother");
  const [targetId, setTargetId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => {
    if (!sourceMember) return [];
    const q = searchQuery.trim().toLowerCase();
    return allMembers
      .filter((m) => m.id !== sourceMember.id)
      .filter((m) => {
        if (!q) return true;
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        return fullName.includes(q);
      })
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      );
  }, [allMembers, sourceMember, searchQuery]);

  if (!sourceMember) return null;

  const selectedTarget =
    allMembers.find((m) => m.id === targetId && m.id !== sourceMember.id) ??
    null;

  const selectedRelationshipMeta =
    RELATIONSHIP_OPTIONS.find((opt) => opt.value === relationship) ??
    RELATIONSHIP_OPTIONS[0];

  const handleSubmit = async () => {
    if (!selectedTarget || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await onConnect(
      sourceMember.id,
      selectedTarget.id,
      relationship
    );
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || "Unable to connect relatives.");
      return;
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel-elevated flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#D4A359]/18 px-6 py-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4A359]">
                <Link2 className="h-3 w-3" />
                Connect Existing Relatives
              </p>
              <h2 className="mt-0.5 font-editorial text-3xl text-[#F5F2EB]">
                Link {sourceMember.firstName} {sourceMember.lastName}
              </h2>
              <p className="mt-1 text-xs text-[#A6A095]">
                Connect two people already on the tree without creating
                duplicates.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close connect relative dialog"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] transition hover:border-[#D4A359]/40 hover:text-[#F5F2EB] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="archival-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Step 1: Relationship Selector */}
            <div>
              <div className="text-xs font-medium text-[#E6C385]">
                1. Link{" "}
                <span className="text-[#F5F2EB]">
                  {sourceMember.firstName} {sourceMember.lastName}
                </span>{" "}
                as&hellip;
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const active = relationship === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRelationship(opt.value);
                        setError(null);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        active
                          ? "border-[#E6C385] bg-[#D4A359] text-[#090D0B] font-semibold shadow-[0_0_20px_rgba(212,163,89,0.28)]"
                          : "border-[#D4A359]/24 bg-[#0B110E]/75 text-[#E6C385] hover:border-[#D4A359]/55 hover:bg-[#D4A359]/12"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-[#A6A095]">
                {selectedRelationshipMeta.hint}
              </p>
            </div>

            {/* Step 2: Searchable Dropdown / List of Existing Relatives */}
            <div>
              <div className="text-xs font-medium text-[#E6C385]">
                2. &hellip;of which existing relative?
              </div>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A6A095]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search family members by name..."
                  className="w-full rounded-xl border border-[#D4A359]/25 bg-[#090D0B]/80 py-2.5 pl-9 pr-3.5 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/55 focus:border-[#E6C385] focus:outline-none"
                />
              </div>

              <div className="archival-scroll mt-2.5 max-h-60 space-y-1.5 overflow-y-auto rounded-2xl border border-[#D4A359]/18 bg-[#090D0B]/65 p-2">
                {candidates.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#A6A095]">
                    {allMembers.length <= 1
                      ? "Add another family member to the tree first."
                      : "No matching relatives found."}
                  </p>
                ) : (
                  candidates.map((candidate) => {
                    const isSelected = targetId === candidate.id;
                    const existingRel = getExistingRelationLabel(
                      sourceMember,
                      candidate
                    );
                    const isLocked =
                      candidate.accessStatus === "locked" ||
                      candidate.accessStatus === "pending";
                    const initials = `${candidate.firstName[0] ?? ""}${
                      candidate.lastName[0] ?? ""
                    }`.toUpperCase();

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setTargetId(candidate.id);
                          setError(null);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                          isSelected
                            ? "border-[#E6C385] bg-[#D4A359]/18"
                            : "border-transparent bg-[#0E1511]/70 hover:border-[#D4A359]/35 hover:bg-[#131C17]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D4A359]/40 bg-[#090D0B]">
                            {!isLocked && candidate.portraitUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={candidate.portraitUrl}
                                alt={`${candidate.firstName} ${candidate.lastName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-editorial text-xs text-[#E6C385]">
                                {initials}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-medium text-[#F5F2EB]">
                                {candidate.firstName} {candidate.lastName}
                              </span>
                              {isLocked && (
                                <Lock className="h-3 w-3 shrink-0 text-[#D4A359]/70" />
                              )}
                            </div>
                            <div className="text-[10.5px] text-[#A6A095]">
                              {getGenerationLabel(candidate.generation)}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {existingRel && (
                            <span className="rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-2 py-0.5 text-[10px] text-[#E6C385]">
                              {existingRel}
                            </span>
                          )}
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-[#E6C385] bg-[#D4A359] text-[#090D0B]"
                                : "border-[#F5F2EB]/15"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Relationship Preview */}
            {selectedTarget && (
              <div className="rounded-2xl border border-[#D4A359]/30 bg-[#D4A359]/10 px-4 py-3 text-xs text-[#F5F2EB]">
                <span className="font-semibold text-[#E6C385]">
                  {sourceMember.firstName} {sourceMember.lastName}
                </span>{" "}
                will be linked as{" "}
                <span className="font-semibold text-[#E6C385]">
                  {selectedRelationshipMeta.label}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#E6C385]">
                  {selectedTarget.firstName} {selectedTarget.lastName}
                </span>
                .
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#D4A359]/16 bg-[#0B110E]/80 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#F5F2EB]/14 px-4 py-2 text-xs text-[#A6A095] transition hover:text-[#F5F2EB] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedTarget || submitting}
              onClick={() => void handleSubmit()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A359] px-5 py-2 text-xs font-semibold text-[#090D0B] shadow-[0_0_24px_rgba(212,163,89,0.3)] transition hover:bg-[#E6C385] disabled:opacity-45 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {submitting ? "Connecting..." : "Connect Relatives"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
