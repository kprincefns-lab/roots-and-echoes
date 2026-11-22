"use client";

import { ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Globe,
  Loader2,
  Lock,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  FamilyMember,
  SPIRIT_ANIMAL_META,
  SpiritAnimalType,
} from "@/types/family";

interface EditMemberModalProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSaveEdits: (
    memberId: string,
    updates: Partial<FamilyMember>
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteMember: (memberId: string) => Promise<{ ok: boolean; error?: string }>;
}

async function cropSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 360;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function EditMemberModal({
  member,
  onClose,
  onSaveEdits,
  onDeleteMember,
}: EditMemberModalProps) {
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [maidenName, setMaidenName] = useState(member?.maidenName ?? "");
  const [birthYear, setBirthYear] = useState(
    member?.birthYear ? String(member.birthYear) : ""
  );
  const [passingYear, setPassingYear] = useState(
    member?.passingYear ? String(member.passingYear) : ""
  );
  const [birthPlace, setBirthPlace] = useState(member?.birthPlace ?? "");
  const [occupation, setOccupation] = useState(member?.occupation ?? "");
  const [bio, setBio] = useState(member?.bio ?? "");
  const [philosophy, setPhilosophy] = useState(member?.beliefs?.philosophy ?? "");
  const [adviceForFuture, setAdviceForFuture] = useState(
    member?.beliefs?.adviceForFuture ?? ""
  );
  const [bloodType, setBloodType] = useState(member?.health?.bloodType ?? "");
  const [hereditaryGuidance, setHereditaryGuidance] = useState(
    member?.health?.hereditaryGuidance ?? ""
  );
  const [spiritAnimal, setSpiritAnimal] = useState<SpiritAnimalType | "">(
    member?.spiritAnimal ?? ""
  );
  const [isPublicToFamily, setIsPublicToFamily] = useState(
    Boolean(member?.isPublicToFamily)
  );
  const [portraitPreview, setPortraitPreview] = useState(
    member?.portraitUrl ?? ""
  );
  const [portraitChanged, setPortraitChanged] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!member) return null;

  const handlePortraitUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const cropped = await cropSquare(file);
    setPortraitPreview(cropped);
    setPortraitChanged(true);
  };

  const handleSave = async () => {
    if (saving || !firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError(null);

    const updates: Partial<FamilyMember> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      maidenName: maidenName.trim() || undefined,
      birthYear: Number(birthYear) || member.birthYear,
      passingYear: passingYear.trim() ? Number(passingYear) : undefined,
      birthPlace: birthPlace.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim(),
      spiritAnimal: spiritAnimal || undefined,
      isPublicToFamily,
      beliefs: {
        ...member.beliefs,
        philosophy: philosophy.trim() || member.beliefs.philosophy,
        adviceForFuture:
          adviceForFuture.trim() || member.beliefs.adviceForFuture,
      },
      health: {
        ...member.health,
        bloodType: bloodType.trim() || undefined,
        hereditaryGuidance:
          hereditaryGuidance.trim() || member.health.hereditaryGuidance,
      },
    };

    if (portraitChanged && portraitPreview) {
      updates.portraitUrl = portraitPreview;
    }

    const res = await onSaveEdits(member.id, updates);
    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Failed to update profile in Supabase.");
      return;
    }

    onClose();
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const res = await onDeleteMember(member.id);
    setDeleting(false);

    if (!res.ok) {
      setError(res.error || "Failed to delete profile.");
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel-elevated flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D4A359]/18 px-6 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4A359]">
                Profile Stewardship
              </p>
              <h2 className="mt-0.5 font-editorial text-3xl text-[#F5F2EB]">
                Edit {member.firstName} {member.lastName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Form */}
          <div className="archival-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Portrait & Privacy Toggle */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[#D4A359]/22 bg-[#0B110E]/75 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D4A359]/50 bg-[#090D0B]">
                  {portraitPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portraitPreview}
                      alt={firstName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D4A359]/35 bg-[#D4A359]/10 px-3.5 py-1.5 text-xs font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20">
                  <Upload className="h-3.5 w-3.5" />
                  Change Portrait
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handlePortraitUpload(e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Share with all verified family toggle */}
              <button
                type="button"
                onClick={() => setIsPublicToFamily((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-xs transition cursor-pointer ${
                  isPublicToFamily
                    ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-200"
                    : "border-[#D4A359]/25 bg-[#090D0B]/80 text-[#A6A095]"
                }`}
              >
                {isPublicToFamily ? (
                  <Globe className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-[#D4A359]" />
                )}
                <div>
                  <div className="font-medium text-[#F5F2EB]">
                    {isPublicToFamily
                      ? "Shared with All Verified Family"
                      : "Private by Default (Request Required)"}
                  </div>
                  <div className="text-[10.5px] opacity-80">
                    Click to toggle visibility for logged-in relatives
                  </div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-[#A6A095]">First Name *</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#A6A095]">Last Name *</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-[#A6A095]">Maiden Name</span>
                <input
                  type="text"
                  value={maidenName}
                  onChange={(e) => setMaidenName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#A6A095]">Birth Year</span>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#A6A095]">Passing Year</span>
                <input
                  type="number"
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  placeholder="Living"
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-[#A6A095]">Birthplace</span>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#A6A095]">Vocation</span>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-[#E6C385]">Biography</span>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-[#E6C385]">Life Philosophy</span>
                <input
                  type="text"
                  value={philosophy}
                  onChange={(e) => setPhilosophy(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[#E6C385]">Blood Type</span>
                <input
                  type="text"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-[#E6C385]">
                Advice for Future Generations
              </span>
              <textarea
                rows={2}
                value={adviceForFuture}
                onChange={(e) => setAdviceForFuture(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[#E6C385]">
                Hereditary Health Guidance
              </span>
              <textarea
                rows={2}
                value={hereditaryGuidance}
                onChange={(e) => setHereditaryGuidance(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
              />
            </label>

            {/* Spirit Animal */}
            <div>
              <span className="text-xs text-[#E6C385]">
                Branch Spirit Guardian
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSpiritAnimal("")}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium cursor-pointer ${
                    spiritAnimal === ""
                      ? "bg-[#D4A359] text-[#090D0B]"
                      : "border border-[#F5F2EB]/15 text-[#A6A095]"
                  }`}
                >
                  None
                </button>
                {(Object.keys(SPIRIT_ANIMAL_META) as SpiritAnimalType[]).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSpiritAnimal(key)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium cursor-pointer ${
                        spiritAnimal === key
                          ? "bg-[#D4A359] text-[#090D0B]"
                          : "border border-[#D4A359]/25 bg-[#D4A359]/8 text-[#E6C385]"
                      }`}
                    >
                      {SPIRIT_ANIMAL_META[key].label}
                    </button>
                  )
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3.5 py-2.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#D4A359]/16 bg-[#0B110E]/80 px-6 py-4">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 px-3.5 py-2 text-xs text-red-300/85 transition hover:border-red-400/55 hover:bg-red-500/12 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[#A6A095] hover:text-[#F5F2EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500/85 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Delete
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={saving || !firstName.trim() || !lastName.trim()}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A359] px-5 py-2 text-xs font-semibold text-[#090D0B] shadow-[0_0_24px_rgba(212,163,89,0.3)] transition hover:bg-[#E6C385] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
