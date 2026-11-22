"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Clock,
  Globe,
  Inbox,
  Loader2,
  Lock,
  Pencil,
  Send,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { AccessRequestRecord, FamilyMember } from "@/types/family";

type DrawerTab = "incoming" | "profiles" | "outgoing";

interface RequestsDrawerProps {
  open: boolean;
  viewerEmail: string;
  isCurator: boolean;
  members: FamilyMember[];
  incoming: AccessRequestRecord[];
  outgoing: AccessRequestRecord[];
  onClose: () => void;
  onRespondRequest: (
    requestId: string,
    decision: "approved" | "declined"
  ) => Promise<{ ok: boolean; error?: string }>;
  onSelectMember: (id: string) => void;
  onEditMember: (member: FamilyMember) => void;
  onTogglePublicToFamily: (
    memberId: string,
    isPublic: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function RequestsDrawer({
  open,
  viewerEmail,
  isCurator,
  members,
  incoming,
  outgoing,
  onClose,
  onRespondRequest,
  onSelectMember,
  onEditMember,
  onTogglePublicToFamily,
}: RequestsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("incoming");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownedProfiles = members.filter(
    (m) => m.ownerEmail?.toLowerCase() === viewerEmail.toLowerCase()
  );
  const pendingIncomingCount = incoming.filter(
    (r) => r.status === "pending"
  ).length;

  const handleDecision = async (
    requestId: string,
    decision: "approved" | "declined"
  ) => {
    setBusyId(requestId);
    setError(null);
    const res = await onRespondRequest(requestId, decision);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error || "Unable to update request.");
    }
  };

  const handleTogglePublic = async (member: FamilyMember) => {
    setBusyId(member.id);
    setError(null);
    const res = await onTogglePublicToFamily(
      member.id,
      !member.isPublicToFamily
    );
    setBusyId(null);
    if (!res.ok) {
      setError(res.error || "Unable to update visibility.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs"
        >
          <motion.aside
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ type: "spring", stiffness: 290, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated fixed right-4 top-20 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-[460px] flex-col overflow-hidden rounded-3xl"
          >
            {/* Header */}
            <div className="border-b border-[#D4A359]/18 px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4A359]">
                    {isCurator ? "Curator & Family Hub" : "Family Privacy Hub"}
                  </p>
                  <h2 className="mt-0.5 font-editorial text-3xl text-[#F5F2EB]">
                    My Profiles &amp; Requests
                  </h2>
                  <p className="mt-1 text-[11px] text-[#A6A095]">
                    Signed in as <span className="text-[#E6C385]">{viewerEmail}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-[#F5F2EB]/8 bg-[#090D0B]/65 p-1">
                {(
                  [
                    {
                      id: "incoming",
                      label: `Requests (${pendingIncomingCount})`,
                      icon: Inbox,
                    },
                    {
                      id: "profiles",
                      label: `My Profiles (${ownedProfiles.length})`,
                      icon: UserCheck,
                    },
                    {
                      id: "outgoing",
                      label: `Sent (${outgoing.length})`,
                      icon: Send,
                    },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[10.5px] font-medium transition cursor-pointer ${
                        active
                          ? "bg-[#D4A359] text-[#090D0B]"
                          : "text-[#A6A095] hover:text-[#F5F2EB]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab Body */}
            <div className="archival-scroll flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {activeTab === "incoming" && (
                <>
                  {incoming.length === 0 ? (
                    <div className="rounded-2xl border border-[#F5F2EB]/8 bg-[#0B110E]/60 p-6 text-center text-xs text-[#A6A095]">
                      No incoming access requests yet. When relatives request to view a profile you own, their requests appear here.
                    </div>
                  ) : (
                    incoming.map((req) => {
                      const displayName =
                        req.requesterName || req.requesterEmail.split("@")[0];
                      const reqInitials = displayName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((s) => s[0] ?? "")
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={req.id}
                          className="rounded-2xl border border-[#D4A359]/22 bg-[#0B110E]/80 p-4 space-y-3"
                        >
                          {/* Requester Identity Header: Google Photo, Full Name, Email */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {req.requesterAvatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={req.requesterAvatarUrl}
                                  alt={displayName}
                                  referrerPolicy="no-referrer"
                                  className="h-10 w-10 shrink-0 rounded-full border border-[#D4A359]/45 object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4A359]/35 bg-[#121B16] font-editorial text-sm text-[#E6C385]">
                                  {reqInitials || "?"}
                                </span>
                              )}

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[#F5F2EB]">
                                  {displayName}
                                </div>
                                <div className="truncate text-[11px] text-[#A6A095]">
                                  {req.requesterEmail}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                                req.status === "approved"
                                  ? "bg-emerald-500/18 text-emerald-300"
                                  : req.status === "declined"
                                    ? "bg-red-500/18 text-red-300"
                                    : "bg-[#D4A359]/18 text-[#E6C385]"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          {/* Tree Cross-Reference Badge */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.requesterTreeMemberName ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (req.requesterTreeMemberId) {
                                    onSelectMember(req.requesterTreeMemberId);
                                    onClose();
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-200 transition hover:bg-emerald-500/20 cursor-pointer"
                              >
                                <UserCheck className="h-3 w-3 text-emerald-400" />
                                On Tree as: {req.requesterTreeMemberName}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/70 px-2.5 py-0.5 text-[10.5px] text-[#A6A095]">
                                Not yet listed on tree
                              </span>
                            )}

                            <span
                              className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${
                                req.requestType === "claim"
                                  ? "bg-amber-500/20 text-amber-200"
                                  : "bg-[#D4A359]/15 text-[#E6C385]"
                              }`}
                            >
                              {req.requestType === "claim"
                                ? `Claiming ${req.memberName}`
                                : `Requesting ${req.memberName}`}
                            </span>
                          </div>

                          {req.note && (
                            <p className="rounded-xl border border-[#D4A359]/15 bg-[#090D0B]/70 px-3 py-2 text-xs italic text-[#F5F2EB]/90">
                              &ldquo;{req.note}&rdquo;
                            </p>
                          )}

                          {req.status === "pending" && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={busyId === req.id}
                                onClick={() =>
                                  void handleDecision(req.id, "approved")
                                }
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#D4A359] px-3 py-1.5 text-xs font-semibold text-[#090D0B] transition hover:bg-[#E6C385] disabled:opacity-50 cursor-pointer"
                              >
                                {busyId === req.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {req.requestType === "claim"
                                  ? "Transfer Ownership"
                                  : "Approve Access"}
                              </button>
                              <button
                                type="button"
                                disabled={busyId === req.id}
                                onClick={() =>
                                  void handleDecision(req.id, "declined")
                                }
                                className="inline-flex items-center justify-center gap-1 rounded-full border border-[#F5F2EB]/15 px-3.5 py-1.5 text-xs text-[#A6A095] transition hover:border-red-400/45 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === "profiles" && (
                <>
                  {ownedProfiles.length === 0 ? (
                    <div className="rounded-2xl border border-[#F5F2EB]/8 bg-[#0B110E]/60 p-6 text-center text-xs text-[#A6A095]">
                      You haven&rsquo;t created or claimed any profiles yet. Any relative you add via &ldquo;+ Add to the Tree&rdquo; is automatically owned by you, or click an unowned profile to request ownership.
                    </div>
                  ) : (
                    ownedProfiles.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-[#D4A359]/22 bg-[#0B110E]/80 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMember(m.id);
                              onClose();
                            }}
                            className="text-left hover:text-[#E6C385] cursor-pointer"
                          >
                            <div className="font-editorial text-xl text-[#F5F2EB]">
                              {m.firstName} {m.lastName}
                            </div>
                            <div className="text-[11px] text-[#A6A095]">
                              {m.approvedViewerEmails?.length ?? 0} approved relatives
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditMember(m);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-3 py-1.5 text-[11px] font-medium text-[#E6C385] hover:bg-[#D4A359]/20 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={busyId === m.id}
                          onClick={() => void handleTogglePublic(m)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[11px] transition cursor-pointer ${
                            m.isPublicToFamily
                              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                              : "border-[#F5F2EB]/10 bg-[#090D0B]/70 text-[#A6A095]"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {m.isPublicToFamily ? (
                              <Globe className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-[#D4A359]" />
                            )}
                            {m.isPublicToFamily
                              ? "Shared with all verified family"
                              : "Private (approval required)"}
                          </span>
                          <span className="text-[10px] underline">
                            {busyId === m.id ? "Updating..." : "Switch"}
                          </span>
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === "outgoing" && (
                <>
                  {outgoing.length === 0 ? (
                    <div className="rounded-2xl border border-[#F5F2EB]/8 bg-[#0B110E]/60 p-6 text-center text-xs text-[#A6A095]">
                      You haven&rsquo;t requested access to any private profiles yet.
                    </div>
                  ) : (
                    outgoing.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-2xl border border-[#F5F2EB]/10 bg-[#0B110E]/75 px-4 py-3"
                      >
                        <div>
                          <div className="font-editorial text-lg text-[#F5F2EB]">
                            {req.memberName}
                          </div>
                          <div className="text-[10.5px] text-[#A6A095]">
                            {req.requestType === "claim"
                              ? "Ownership claim"
                              : "Information request"}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium capitalize ${
                            req.status === "approved"
                              ? "bg-emerald-500/18 text-emerald-300"
                              : req.status === "declined"
                                ? "bg-red-500/18 text-red-300"
                                : "bg-[#D4A359]/18 text-[#E6C385]"
                          }`}
                        >
                          {req.status === "approved" ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {req.status}
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
