"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Compass,
  HeartPulse,
  MapPin,
  MessageCircleHeart,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import {
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
  onClose: () => void;
  onSelectMember: (id: string) => void;
  onAddMemoryPhoto: (memberId: string, photo: MemoryPhoto) => void;
  onUpdateSpiritAnimal: (
    memberId: string,
    animal: SpiritAnimalType | undefined
  ) => void;
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
  onClose,
  onSelectMember,
  onAddMemoryPhoto,
  onUpdateSpiritAnimal,
  onQuickAddRelative,
}: MemberDossierProps) {
  const [activeTab, setActiveTab] = useState<DossierTab>("stories");
  const [spiritMenuOpen, setSpiritMenuOpen] = useState(false);

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
              <button
                type="button"
                onClick={() => onQuickAddRelative(member.id)}
                title={`Add relative linked to ${member.firstName}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-3 py-1.5 text-[11px] font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Link Relative</span>
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

            <div className="flex items-center gap-4 pr-20">
              {/* Circular Portrait Medallion */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-full p-[2px] bg-gradient-to-br from-[#E6C385] via-[#D4A359]/60 to-transparent shadow-[0_0_28px_rgba(212,163,89,0.28)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.portraitUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="h-full w-full rounded-full object-cover bg-[#090D0B]"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A359]">
                  {getGenerationLabel(member.generation)}
                </div>
                <h2 className="mt-0.5 truncate font-editorial text-3xl leading-tight text-[#F5F2EB]">
                  {member.firstName} {member.lastName}
                </h2>
                {member.maidenName && (
                  <p className="text-xs italic text-[#A6A095]">
                    née {member.maidenName}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[#E6C385]/90">
                  <span>{getMemberLifespanLabel(member)}</span>
                  {member.birthPlace && (
                    <span className="inline-flex items-center gap-1 text-[#A6A095]">
                      <MapPin className="h-3 w-3 text-[#D4A359]/70" />
                      {member.birthPlace}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {member.occupation ? (
                <p className="text-xs text-[#A6A095]">{member.occupation}</p>
              ) : (
                <span />
              )}

              {/* Spirit Animal of Light Badge / Switcher */}
              <button
                type="button"
                onClick={() => setSpiritMenuOpen((v) => !v)}
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
                    : "Choose Spirit Animal"}
                </span>
              </button>
            </div>

            <AnimatePresence>
              {spiritMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D4A359]/22 bg-[#0B110E]/85 p-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSpiritAnimal(member.id, undefined);
                        setSpiritMenuOpen(false);
                      }}
                      className={`rounded-full px-2.5 py-1 text-[10.5px] transition cursor-pointer ${
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
                        onClick={() => {
                          onUpdateSpiritAnimal(member.id, key);
                          setSpiritMenuOpen(false);
                        }}
                        className={`rounded-full px-2.5 py-1 text-[10.5px] transition cursor-pointer ${
                          member.spiritAnimal === key
                            ? "bg-[#D4A359] text-[#090D0B] font-semibold"
                            : "border border-[#D4A359]/25 bg-[#D4A359]/8 text-[#E6C385] hover:bg-[#D4A359]/18"
                        }`}
                      >
                        {SPIRIT_ANIMAL_META[key].label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clickable Relationship Badges */}
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

            {/* Animated Tab Navigation */}
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
                    <span className="relative z-10 leading-none">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Tab Content */}
          <div className="archival-scroll flex-1 overflow-y-auto px-6 pt-5">
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
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
