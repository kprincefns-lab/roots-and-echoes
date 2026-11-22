"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Globe,
  HeartPulse,
  Loader2,
  Lock,
  MapPin,
  MessageCircleHeart,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import {
  AccessRequestType,
  FamilyMember,
  MemoryPhoto,
  SPIRIT_ANIMAL_META,
  SpiritAnimalType,
} from "@/types/family";
import {
  getGenerationLabel,
  getMemberLifespanLabel,
} from "@/lib/lineage";
import { LifeStoriesTab } from "./LifeStoriesTab";
import { BeliefsTab } from "./BeliefsTab";
import { HealthGeneticsTab } from "./HealthGeneticsTab";
import { DigitalCloneTab } from "./DigitalCloneTab";

type DossierTab = "stories" | "beliefs" | "health" | "echo";

interface MemberDossierProps {
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  viewerIsOnTree: boolean;
  onClose: () => void;
  onSelectMember: (id: string) => void;
  onAddMemoryPhoto: (
    memberId: string,
    photo: MemoryPhoto
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdateSpiritAnimal: (
    memberId: string,
    animal: SpiritAnimalType | undefined
  ) => Promise<{ ok: boolean; error?: string }>;
  onTogglePublicToFamily: (
    memberId: string,
    isPublic: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  onEditMember: (member: FamilyMember) => void;
  onRequestAccess: (
    memberId: string,
    note: string,
    requestType: AccessRequestType
  ) => Promise<{ ok: boolean; error?: string }>;
  onQuickAddRelative: (memberId: string) => void;
}

const TABS: Array<{ id: DossierTab; label: string; icon: typeof BookOpen }> = [
  { id: "stories", label: "Life & Stories", icon: BookOpen },
  { id: "beliefs", label: "Beliefs", icon: Compass },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "echo", label: "Digital Echo", icon: MessageCircleHeart },
];

export function MemberDossier({
  member,
  allMembers,
  viewerIsOnTree,
  onClose,
  onSelectMember,
  onAddMemoryPhoto,
  onUpdateSpiritAnimal,
  onTogglePublicToFamily,
  onEditMember,
  onRequestAccess,
  onQuickAddRelative,
}: MemberDossierProps) {
  const [activeTab, setActiveTab] = useState<DossierTab>("stories");
  const [spiritMenuOpen, setSpiritMenuOpen] = useState(false);
  const [savingSpirit, setSavingSpirit] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Locked profile request state
  const [requestNote, setRequestNote] = useState("");
  const [requestingType, setRequestingType] =
    useState<AccessRequestType | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const parents = member
    ? member.parentIds
        .map((id) => byId.get(id))
        .filter((m): m is FamilyMember => Boolean(m))
    : [];
  const partners = member
    ? member.partnerIds
        .map((id) => byId.get(id))
        .filter((m): m is FamilyMember => Boolean(m))
    : [];
  const children = member
    ? member.childrenIds
        .map((id) => byId.get(id))
        .filter((m): m is FamilyMember => Boolean(m))
    : [];

  const isLocked =
    member?.accessStatus === "locked" || member?.accessStatus === "pending";

  const handleSelectSpirit = async (animal: SpiritAnimalType | undefined) => {
    if (!member || savingSpirit) return;
    setSavingSpirit(true);
    setActionError(null);
    const res = await onUpdateSpiritAnimal(member.id, animal);
    setSavingSpirit(false);
    if (!res.ok) {
      setActionError(res.error || "Unable to update spirit animal.");
      return;
    }
    setSpiritMenuOpen(false);
  };

  const handleTogglePublic = async () => {
    if (!member || togglingPublic) return;
    setTogglingPublic(true);
    setActionError(null);
    const res = await onTogglePublicToFamily(
      member.id,
      !member.isPublicToFamily
    );
    setTogglingPublic(false);
    if (!res.ok) {
      setActionError(res.error || "Unable to update visibility.");
    }
  };

  const handleSendRequest = async (type: AccessRequestType) => {
    if (!member || requestingType) return;
    setRequestingType(type);
    setActionError(null);
    setRequestSuccess(null);
    const res = await onRequestAccess(member.id, requestNote.trim(), type);
    setRequestingType(null);
    if (!res.ok) {
      setActionError(res.error || "Unable to submit request.");
      return;
    }
    setRequestNote("");
    setRequestSuccess(
      type === "claim"
        ? "Ownership claim sent to the Family Curator."
        : "Information request sent to the profile owner."
    );
  };

  const initials = member
    ? `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <AnimatePresence>
      {member && (
        <motion.aside
          key="dossier-drawer"
          initial={{ x: "104%", opacity: 0.4 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "104%", opacity: 0.2 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="glass-panel-elevated fixed right-4 top-20 bottom-4 z-30 flex w-[calc(100vw-2rem)] max-w-[470px] flex-col overflow-hidden rounded-3xl"
        >
          {/* Top Header */}
          <div className="relative border-b border-[#D4A359]/16 px-6 pt-5 pb-4">
            <div className="absolute right-4 top-4 flex items-center gap-1.5">
              {!isLocked && member.canEdit && (
                <button
                  type="button"
                  onClick={() => onEditMember(member)}
                  title="Edit this profile"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/40 bg-[#D4A359]/16 px-3 py-1.5 text-[11px] font-medium text-[#F2DCAA] transition hover:bg-[#D4A359]/28 cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onQuickAddRelative(member.id)}
                title={`Add relative linked to ${member.firstName}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Link</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close member dossier"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] transition hover:border-[#D4A359]/40 hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 pr-24">
              {/* Circular Portrait or Monogram Medallion */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-full p-[2px] bg-gradient-to-br from-[#E6C385] via-[#D4A359]/60 to-transparent shadow-[0_0_28px_rgba(212,163,89,0.28)]">
                  {!isLocked && member.portraitUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.portraitUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="h-full w-full rounded-full object-cover bg-[#090D0B]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0E1612]">
                      <span className="font-editorial text-2xl tracking-wider text-[#E6C385]">
                        {initials}
                      </span>
                      <Lock className="mt-0.5 h-3 w-3 text-[#D4A359]/75" />
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A359]">
                  {getGenerationLabel(member.generation)}
                </div>
                <h2 className="mt-0.5 truncate font-editorial text-3xl leading-tight text-[#F5F2EB]">
                  {member.firstName} {member.lastName}
                </h2>
                {!isLocked && member.maidenName && (
                  <p className="text-xs italic text-[#A6A095]">
                    née {member.maidenName}
                  </p>
                )}
                {!isLocked ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[#E6C385]/90">
                    <span>{getMemberLifespanLabel(member)}</span>
                    {member.birthPlace && (
                      <span className="inline-flex items-center gap-1 text-[#A6A095]">
                        <MapPin className="h-3 w-3 text-[#D4A359]/70" />
                        {member.birthPlace}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[#A6A095]">
                    <Lock className="h-3 w-3 text-[#D4A359]" />
                    <span>
                      {member.accessStatus === "pending"
                        ? "Access Request Pending"
                        : "Private Family Profile"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!isLocked && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {member.occupation ? (
                  <p className="text-xs text-[#A6A095]">{member.occupation}</p>
                ) : (
                  <span />
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Owner Quick Public Toggle */}
                  {member.canEdit && (
                    <button
                      type="button"
                      disabled={togglingPublic}
                      onClick={() => void handleTogglePublic()}
                      title="Toggle sharing with all logged-in family members"
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition cursor-pointer ${
                        member.isPublicToFamily
                          ? "border border-emerald-500/40 bg-emerald-500/14 text-emerald-200"
                          : "border border-[#F5F2EB]/12 bg-[#0B110E]/70 text-[#A6A095] hover:border-[#D4A359]/40"
                      }`}
                    >
                      {member.isPublicToFamily ? (
                        <Globe className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Lock className="h-3 w-3 text-[#D4A359]" />
                      )}
                      <span>
                        {member.isPublicToFamily
                          ? "Shared with Family"
                          : "Private"}
                      </span>
                    </button>
                  )}

                  {/* Spirit Animal Badge / Switcher (editable for owner/curator) */}
                  {member.canEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSpiritMenuOpen((v) => !v);
                        setActionError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition cursor-pointer ${
                        member.spiritAnimal
                          ? "border border-[#E6C385]/45 bg-[#D4A359]/14 text-[#F2DCAA] hover:bg-[#D4A359]/22"
                          : "border border-[#F5F2EB]/12 bg-[#0B110E]/70 text-[#A6A095] hover:border-[#D4A359]/40 hover:text-[#E6C385]"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 text-[#E6C385]" />
                      <span>
                        {member.spiritAnimal
                          ? SPIRIT_ANIMAL_META[member.spiritAnimal].label
                          : "Spirit Animal"}
                      </span>
                    </button>
                  ) : (
                    member.spiritAnimal && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6C385]/35 bg-[#D4A359]/10 px-2.5 py-1 text-[10.5px] text-[#F2DCAA]">
                        <Sparkles className="h-3 w-3 text-[#E6C385]" />
                        {SPIRIT_ANIMAL_META[member.spiritAnimal].label}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <AnimatePresence>
              {!isLocked && spiritMenuOpen && member.canEdit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D4A359]/22 bg-[#0B110E]/85 p-2.5">
                    <button
                      type="button"
                      disabled={savingSpirit}
                      onClick={() => void handleSelectSpirit(undefined)}
                      className={`rounded-full px-2.5 py-1 text-[10.5px] transition cursor-pointer disabled:opacity-50 ${
                        !member.spiritAnimal
                          ? "bg-[#D4A359] text-[#090D0B] font-semibold"
                          : "border border-[#F5F2EB]/12 text-[#A6A095] hover:text-[#F5F2EB]"
                      }`}
                    >
                      None
                    </button>
                    {(
                      Object.keys(SPIRIT_ANIMAL_META) as SpiritAnimalType[]
                    ).map((key) => (
                      <button
                        key={key}
                        type="button"
                        disabled={savingSpirit}
                        onClick={() => void handleSelectSpirit(key)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] transition cursor-pointer disabled:opacity-50 ${
                          member.spiritAnimal === key
                            ? "bg-[#D4A359] text-[#090D0B] font-semibold"
                            : "border border-[#D4A359]/25 bg-[#D4A359]/8 text-[#E6C385] hover:bg-[#D4A359]/18"
                        }`}
                      >
                        {savingSpirit && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        )}
                        {SPIRIT_ANIMAL_META[key].label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clickable Relationship Badges (Names only — always visible for tree navigation) */}
            {(parents.length > 0 || partners.length > 0 || children.length > 0) && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {parents.map((p) => (
                  <button
                    key={`p-${p.id}`}
                    type="button"
                    onClick={() => onSelectMember(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F2EB]/12 bg-[#0B110E]/75 px-2.5 py-1 text-[11px] text-[#F5F2EB]/85 transition hover:border-[#D4A359]/55 hover:text-[#E6C385] cursor-pointer"
                  >
                    <span className="text-[9.5px] uppercase tracking-wider text-[#D4A359]/80">
                      Parent
                    </span>
                    <span>{p.firstName}</span>
                  </button>
                ))}
                {partners.map((p) => (
                  <button
                    key={`sp-${p.id}`}
                    type="button"
                    onClick={() => onSelectMember(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/28 bg-[#D4A359]/10 px-2.5 py-1 text-[11px] text-[#F5F2EB] transition hover:border-[#E6C385]/70 hover:bg-[#D4A359]/20 cursor-pointer"
                  >
                    <span className="text-[9.5px] uppercase tracking-wider text-[#E6C385]">
                      Partner
                    </span>
                    <span>{p.firstName}</span>
                  </button>
                ))}
                {children.map((c) => (
                  <button
                    key={`c-${c.id}`}
                    type="button"
                    onClick={() => onSelectMember(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F2EB]/12 bg-[#0B110E]/75 px-2.5 py-1 text-[11px] text-[#F5F2EB]/85 transition hover:border-[#D4A359]/55 hover:text-[#E6C385] cursor-pointer"
                  >
                    <span className="text-[9.5px] uppercase tracking-wider text-[#D4A359]/80">
                      Child
                    </span>
                    <span>{c.firstName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Animated Tab Navigation (only when viewer has Full Access) */}
            {!isLocked && (
              <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-[#F5F2EB]/8 bg-[#090D0B]/65 p-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition cursor-pointer ${
                        isActive
                          ? "text-[#090D0B]"
                          : "text-[#A6A095] hover:text-[#F5F2EB]"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="dossier-tab-pill"
                          transition={{ type: "spring", stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-[#D4A359]"
                        />
                      )}
                      <Icon className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10 leading-none">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body: Either Private Profile Request Gate OR Full 4-Tab Dossier */}
          <div className="archival-scroll flex-1 overflow-y-auto px-6 pt-5 pb-6">
            {actionError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{actionError}</span>
              </div>
            )}

            {isLocked ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#D4A359]/22 bg-[#0C130F]/80 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#D4A359]/35 bg-[#D4A359]/10 text-[#E6C385]">
                    {member.accessStatus === "pending" ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="mt-3.5 font-editorial text-2xl text-[#F5F2EB]">
                    Private Family Profile
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#A6A095]">
                    To protect personal stories, photos, beliefs, and hereditary
                    notes, profiles in Roots &amp; Echoes show only a relative&rsquo;s
                    name by default until access is approved.
                  </p>

                  {requestSuccess && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{requestSuccess}</span>
                    </div>
                  )}

                  {member.accessStatus === "pending" ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4A359]/35 bg-[#D4A359]/12 px-4 py-2 text-xs font-medium text-[#E6C385]">
                      <Clock className="h-3.5 w-3.5" />
                      Request Pending — Awaiting Approval
                    </div>
                  ) : (
                    <div className="mt-5 space-y-2.5 text-left">
                      <label className="block">
                        <span className="text-[11px] font-medium text-[#E6C385]">
                          {viewerIsOnTree
                            ? "Optional relationship note"
                            : "How are you related? (Required since you aren't on the tree yet) *"}
                        </span>
                        <textarea
                          rows={2}
                          value={requestNote}
                          onChange={(e) => {
                            setRequestNote(e.target.value);
                            setActionError(null);
                          }}
                          placeholder={`e.g., "Aunt Linda's son" or "Cousin from Seattle"`}
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/25 bg-[#090D0B]/80 px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/55 focus:border-[#E6C385] focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={
                          requestingType !== null ||
                          (!viewerIsOnTree && !requestNote.trim())
                        }
                        onClick={() => void handleSendRequest("view")}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4A359] px-5 py-2.5 text-xs font-semibold text-[#090D0B] shadow-[0_8px_24px_rgba(212,163,89,0.32)] transition hover:bg-[#E6C385] disabled:opacity-45 cursor-pointer"
                      >
                        {requestingType === "view" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Request Information
                      </button>
                    </div>
                  )}
                </div>

                {/* Claim Unowned / Curator-Seeded Profile */}
                {!member.ownerEmail && (
                  <div className="rounded-2xl border border-[#F5F2EB]/10 bg-[#0B110E]/70 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#E6C385]">
                      <UserCheck className="h-4 w-4" />
                      Is this your profile?
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#A6A095]">
                      This profile does not have an assigned owner yet. Request
                      ownership from the Family Curator so you can edit details
                      and approve who sees your story.
                    </p>
                    {member.claimPending ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-3 py-1.5 text-[11px] text-[#E6C385]">
                        <Clock className="h-3 w-3" />
                        Ownership Claim Pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={requestingType !== null}
                        onClick={() => void handleSendRequest("claim")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/35 bg-[#D4A359]/10 px-4 py-1.5 text-xs font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 disabled:opacity-50 cursor-pointer"
                      >
                        {requestingType === "claim" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Claim This Profile
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${member.id}-${activeTab}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === "stories" && (
                    <LifeStoriesTab
                      member={member}
                      onAddMemoryPhoto={onAddMemoryPhoto}
                    />
                  )}
                  {activeTab === "beliefs" && <BeliefsTab member={member} />}
                  {activeTab === "health" && (
                    <HealthGeneticsTab key={member.id} member={member} />
                  )}
                  {activeTab === "echo" && (
                    <DigitalCloneTab
                      key={member.id}
                      member={member}
                      allMembers={allMembers}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
