"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import {
  FamilyMember,
  MemoryPhoto,
  RelationshipLinkType,
  SPIRIT_ANIMAL_META,
  SpiritAnimalType,
} from "@/types/family";
import { createArchivalPortrait } from "@/lib/portraits";

interface AddMemberWizardProps {
  open: boolean;
  existingMembers: FamilyMember[];
  initialLinkedMemberId?: string | null;
  onClose: () => void;
  onCreateMember: (
    newMember: FamilyMember,
    linkTargetId: string,
    linkType: RelationshipLinkType
  ) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Center-crops an image file client-side to a crisp 360x360 JPEG data URL
 * so localStorage remains fast and portraits always frame cleanly inside circles.
 */
async function cropImageToSquareDataUrl(
  file: File,
  zoom = 1
): Promise<string> {
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
        const cropSide = minSide / Math.max(1, zoom);
        const sx = (img.width - cropSide) / 2;
        const sy = (img.height - cropSide) / 2;
        ctx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressGalleryImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddMemberWizard({
  open,
  existingMembers,
  initialLinkedMemberId,
  onClose,
  onCreateMember,
}: AddMemberWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identity & Lineage
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [maidenName, setMaidenName] = useState("");
  const [birthYear, setBirthYear] = useState("1992");
  const [passingYear, setPassingYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [occupation, setOccupation] = useState("");
  const [linkedMemberId, setLinkedMemberId] = useState(
    initialLinkedMemberId || existingMembers[0]?.id || ""
  );
  const [relationshipType, setRelationshipType] =
    useState<RelationshipLinkType>("child");

  // Step 2: Portrait & Gallery
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitZoom, setPortraitZoom] = useState(1);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<MemoryPhoto[]>([]);
  const [isDraggingPortrait, setIsDraggingPortrait] = useState(false);

  // Step 3: Stories, Beliefs & Genetics + Visibility
  const [bio, setBio] = useState("");
  const [valuesInput, setValuesInput] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [adviceForFuture, setAdviceForFuture] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [spiritAnimal, setSpiritAnimal] = useState<SpiritAnimalType | "">("");
  const [isPublicToFamily, setIsPublicToFamily] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-crop portrait whenever zoom changes
  useEffect(() => {
    if (!portraitFile) return;
    let cancelled = false;
    void cropImageToSquareDataUrl(portraitFile, portraitZoom).then((url) => {
      if (!cancelled) setPortraitPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [portraitFile, portraitZoom]);

  const resetForm = () => {
    setStep(1);
    setFirstName("");
    setLastName("");
    setMaidenName("");
    setBirthYear("1992");
    setPassingYear("");
    setBirthPlace("");
    setOccupation("");
    setRelationshipType("child");
    setPortraitFile(null);
    setPortraitZoom(1);
    setPortraitPreview(null);
    setGalleryItems([]);
    setBio("");
    setValuesInput("");
    setPhilosophy("");
    setAdviceForFuture("");
    setBloodType("");
    setHealthNotes("");
    setSpiritAnimal("");
  };

  const handlePortraitSelect = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPortraitFile(file);
    setPortraitZoom(1);
  };

  const handlePortraitDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingPortrait(false);
    handlePortraitSelect(e.dataTransfer.files?.[0]);
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const url = await compressGalleryImage(file);
      setGalleryItems((prev) => [
        ...prev,
        {
          id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url,
          caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        },
      ]);
    }
  };

  const canProceedStep1 =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    Number(birthYear) >= 1700 &&
    Number(birthYear) <= new Date().getFullYear() &&
    (existingMembers.length === 0 || Boolean(linkedMemberId));

  const handleFinish = async () => {
    if (isSubmitting) return;

    const targetMember = existingMembers.find((m) => m.id === linkedMemberId);
    const parsedBirth = Number(birthYear) || 1990;
    const parsedPassing = passingYear.trim() ? Number(passingYear) : undefined;

    let generation = targetMember ? targetMember.generation : 0;
    if (targetMember) {
      if (relationshipType === "child") generation += 1;
      if (relationshipType === "parent") generation -= 1;
    }

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const id = `${cleanFirst}-${cleanLast}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");

    const finalPortrait =
      portraitPreview ||
      createArchivalPortrait({
        initials: `${cleanFirst[0] ?? "F"} · ${cleanLast[0] ?? "M"}`.toUpperCase(),
        eraLabel: parsedPassing
          ? `${parsedBirth} — ${parsedPassing}`
          : `B. ${parsedBirth}`,
        palette: ["#131C17", "#26382D", "#D4A359"],
        style: parsedBirth > 2000 ? "youth" : "artist",
      });

    const coreValues = valuesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const resolvedBio =
      bio.trim() ||
      `${cleanFirst} ${cleanLast} was born in ${parsedBirth}${
        birthPlace.trim() ? ` in ${birthPlace.trim()}` : ""
      }, adding a cherished branch to the living family archive.`;

    const resolvedPhilosophy =
      philosophy.trim() ||
      "Stay curious, stay kind, and remember where your roots run deep.";

    const resolvedAdvice =
      adviceForFuture.trim() ||
      "Keep telling our stories around the dinner table so no branch is ever forgotten.";

    const newMember: FamilyMember = {
      id,
      firstName: cleanFirst,
      lastName: cleanLast,
      maidenName: maidenName.trim() || undefined,
      birthYear: parsedBirth,
      passingYear: parsedPassing,
      birthPlace: birthPlace.trim() || undefined,
      occupation: occupation.trim() || undefined,
      generation,
      portraitUrl: finalPortrait,
      spiritAnimal: spiritAnimal || undefined,
      isPublicToFamily,
      parentIds: [],
      partnerIds: [],
      childrenIds: [],
      bio: resolvedBio,
      milestones: [
        {
          year: parsedBirth,
          title: `Born${birthPlace.trim() ? ` in ${birthPlace.trim()}` : ""}`,
          description: `The beginning of ${cleanFirst}'s chapter in the family archive.`,
        },
      ],
      gallery: galleryItems,
      beliefs: {
        coreValues:
          coreValues.length > 0
            ? coreValues
            : ["Family", "Kindness", "Curiosity"],
        philosophy: resolvedPhilosophy,
        favoriteQuotes: [resolvedPhilosophy],
        spiritualBeliefs: "Preserved in family memory and shared values.",
        adviceForFuture: resolvedAdvice,
      },
      health: {
        bloodType: bloodType.trim() || undefined,
        longevityNotes: "Added by family contributor.",
        knownConditions: healthNotes.trim()
          ? healthNotes
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : ["No specific hereditary conditions recorded yet."],
        lifestyleNotes: "Preserved in family archive.",
        hereditaryGuidance:
          healthNotes.trim() ||
          "Continue updating health and longevity notes for future generations.",
      },
      persona: {
        era: `${Math.floor(parsedBirth / 10) * 10}s–Present Family Voice`,
        tone: "Warm, personal, and deeply connected to family",
        traits:
          coreValues.length > 0
            ? coreValues.slice(0, 3)
            : ["Warm", "Thoughtful", "Family-minded"],
        greeting: `Hello! It's ${cleanFirst}. I'm so glad you stopped by my branch of the tree—what would you like to talk about?`,
        suggestedPrompts: [
          `Tell me a story from your life, ${cleanFirst}.`,
          "What principles mattered most to you?",
          "What advice do you have for future generations?",
        ],
      },
    };

    setIsSubmitting(true);
    setSubmitError(null);
    const result = await onCreateMember(
      newMember,
      linkedMemberId,
      relationshipType
    );
    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(
        result.error || "Unable to save this member to Supabase. Please try again."
      );
      return;
    }

    resetForm();
    onClose();
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
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-elevated relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl"
          >
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-[#D4A359]/18 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#D4A359]">
                  <UserPlus className="h-3.5 w-3.5" />
                  Plant a New Branch
                </div>
                <h2 className="mt-1 font-editorial text-3xl text-[#F5F2EB]">
                  {step === 1 && "Identity & Lineage"}
                  {step === 2 && "Portrait & Memory Gallery"}
                  {step === 3 && "Stories, Beliefs & Genetics"}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close wizard"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F5F2EB]/12 bg-[#090D0B]/50 text-[#A6A095] transition hover:border-[#D4A359]/45 hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Indicator Bar */}
            <div className="grid grid-cols-3 gap-2 border-b border-[#F5F2EB]/6 bg-[#0B110E]/60 px-6 py-3">
              {[
                { num: 1, label: "1. Lineage" },
                { num: 2, label: "2. Portraits" },
                { num: 3, label: "3. Living Story" },
              ].map((s) => (
                <div key={s.num} className="space-y-1.5">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step >= s.num ? "bg-[#D4A359]" : "bg-[#F5F2EB]/12"
                    }`}
                  />
                  <span
                    className={`block text-[10.5px] font-medium tracking-wide ${
                      step === s.num ? "text-[#E6C385]" : "text-[#A6A095]/75"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="archival-scroll flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    className="space-y-5"
                  >
                    {/* Relationship Sentence Builder */}
                    {existingMembers.length > 0 ? (
                      <div className="rounded-2xl border border-[#D4A359]/28 bg-[#D4A359]/8 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E6C385]">
                          Connect to the Tree
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-[#F5F2EB]">
                          <span>Link to</span>
                          <select
                            value={linkedMemberId}
                            onChange={(e) => setLinkedMemberId(e.target.value)}
                            className="rounded-xl border border-[#D4A359]/35 bg-[#090D0B] px-3 py-2 text-xs font-medium text-[#F5F2EB] focus:border-[#E6C385] focus:outline-none"
                          >
                            {existingMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.firstName} {m.lastName} ({m.birthYear})
                              </option>
                            ))}
                          </select>
                          <span>as their</span>
                          <div className="inline-flex flex-wrap gap-1 rounded-xl border border-[#D4A359]/30 bg-[#090D0B]/85 p-1">
                            {(
                              [
                                "child",
                                "partner",
                                "parent",
                                "brother",
                                "sister",
                              ] as const
                            ).map((rel) => (
                              <button
                                key={rel}
                                type="button"
                                onClick={() => setRelationshipType(rel)}
                                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition cursor-pointer ${
                                  relationshipType === rel
                                    ? "bg-[#D4A359] text-[#090D0B]"
                                    : "text-[#A6A095] hover:text-[#F5F2EB]"
                                }`}
                              >
                                {rel}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#D4A359]/28 bg-[#D4A359]/8 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E6C385]">
                          Planting First Founding Ancestor
                        </p>
                        <p className="mt-1.5 text-xs text-[#F5F2EB]/85">
                          This member will anchor Generation I (Roots) of your new shared family tree.
                        </p>
                      </div>
                    )}

                    {/* Name & Vital Fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          First Name *
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g., Elena"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Last Name *
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g., Vance"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Maiden Name
                        </span>
                        <input
                          type="text"
                          value={maidenName}
                          onChange={(e) => setMaidenName(e.target.value)}
                          placeholder="Optional"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Birth Year *
                        </span>
                        <input
                          type="number"
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          min={1700}
                          max={new Date().getFullYear()}
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Passing Year
                        </span>
                        <input
                          type="number"
                          value={passingYear}
                          onChange={(e) => setPassingYear(e.target.value)}
                          placeholder="Leave blank if living"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Birthplace
                        </span>
                        <input
                          type="text"
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          placeholder="e.g., Portland, Maine"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#A6A095]">
                          Vocation / Passion
                        </span>
                        <input
                          type="text"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="e.g., Botanist & Painter"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    className="space-y-6"
                  >
                    {/* Portrait Drag & Drop + Crop Preview */}
                    <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-2">
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPortrait(true);
                        }}
                        onDragLeave={() => setIsDraggingPortrait(false)}
                        onDrop={handlePortraitDrop}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition ${
                          isDraggingPortrait
                            ? "border-[#E6C385] bg-[#D4A359]/15"
                            : "border-[#D4A359]/35 bg-[#0B110E]/70 hover:border-[#D4A359]/65"
                        }`}
                      >
                        <Upload className="h-6 w-6 text-[#D4A359]" />
                        <p className="mt-2.5 text-sm font-medium text-[#F5F2EB]">
                          Drop a portrait here
                        </p>
                        <p className="mt-1 text-xs text-[#A6A095]">
                          or click to browse (JPG, PNG, WebP)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handlePortraitSelect(e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </label>

                      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F5F2EB]/10 bg-[#0B110E]/60 p-5">
                        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#D4A359]/60 bg-[#121B16] shadow-[0_0_24px_rgba(212,163,89,0.2)]">
                          {portraitPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={portraitPreview}
                              alt="Cropped portrait preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-center">
                              <span className="font-editorial text-2xl text-[#E6C385]">
                                {(firstName[0] || "R").toUpperCase()} ·{" "}
                                {(lastName[0] || "E").toUpperCase()}
                              </span>
                              <span className="mt-1 text-[9px] uppercase tracking-widest text-[#A6A095]">
                                Auto Monogram
                              </span>
                            </div>
                          )}
                        </div>

                        {portraitFile && (
                          <div className="mt-4 w-full space-y-1">
                            <div className="flex justify-between text-[10.5px] text-[#A6A095]">
                              <span>Crop Zoom</span>
                              <span>{portraitZoom.toFixed(1)}×</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={2.4}
                              step={0.1}
                              value={portraitZoom}
                              onChange={(e) =>
                                setPortraitZoom(Number(e.target.value))
                              }
                              className="w-full accent-[#D4A359]"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-Photo Memory Gallery Uploader */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A359]">
                            Memory Photos (Optional)
                          </h3>
                          <p className="mt-0.5 text-xs text-[#A6A095]">
                            Add snapshots, handwritten letters, or favorite places.
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D4A359]/35 bg-[#D4A359]/12 px-3.5 py-1.5 text-xs font-medium text-[#E6C385] transition hover:bg-[#D4A359]/22">
                          <ImagePlus className="h-3.5 w-3.5" />
                          Add Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => void handleGalleryUpload(e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {galleryItems.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {galleryItems.map((item) => (
                            <div
                              key={item.id}
                              className="relative overflow-hidden rounded-xl border border-[#D4A359]/20 bg-[#090D0B]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.url}
                                alt={item.caption}
                                className="aspect-[4/3] w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setGalleryItems((prev) =>
                                    prev.filter((g) => g.id !== item.id)
                                  )
                                }
                                aria-label="Remove memory photo"
                                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-[#F5F2EB] hover:bg-red-900/80 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <input
                                type="text"
                                value={item.caption}
                                onChange={(e) =>
                                  setGalleryItems((prev) =>
                                    prev.map((g) =>
                                      g.id === item.id
                                        ? { ...g, caption: e.target.value }
                                        : g
                                    )
                                  )
                                }
                                placeholder="Caption..."
                                className="w-full bg-transparent px-2.5 py-1.5 text-[11px] text-[#F5F2EB] focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    className="space-y-4"
                  >
                    <label className="block">
                      <span className="text-xs font-medium text-[#E6C385]">
                        What is a story from their youth or life everyone should know?
                      </span>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Share a vivid memory, turning point, or what made them unforgettable..."
                        className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-[#E6C385]">
                          Core Values (comma-separated)
                        </span>
                        <input
                          type="text"
                          value={valuesInput}
                          onChange={(e) => setValuesInput(e.target.value)}
                          placeholder="e.g., Honesty, Music, Generosity"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#E6C385]">
                          Blood Type (Optional)
                        </span>
                        <input
                          type="text"
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          placeholder="e.g., O+, A-, B+"
                          className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-medium text-[#E6C385]">
                        What principles did they live by?
                      </span>
                      <input
                        type="text"
                        value={philosophy}
                        onChange={(e) => setPhilosophy(e.target.value)}
                        placeholder="A guiding motto, life philosophy, or favorite saying..."
                        className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-[#E6C385]">
                        Personal advice written for future generations
                      </span>
                      <textarea
                        rows={2}
                        value={adviceForFuture}
                        onChange={(e) => setAdviceForFuture(e.target.value)}
                        placeholder="A letter or piece of wisdom for grandchildren yet to come..."
                        className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-[#E6C385]">
                        Any hereditary health notes for future generations?
                      </span>
                      <textarea
                        rows={2}
                        value={healthNotes}
                        onChange={(e) => setHealthNotes(e.target.value)}
                        placeholder="Stored privately behind the Sensitive Health reveal toggle..."
                        className="mt-1.5 w-full rounded-xl border border-[#D4A359]/22 bg-[#090D0B]/75 px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A6A095]/50 focus:border-[#D4A359] focus:outline-none"
                      />
                    </label>

                    {/* Optional Branch Spirit Animal Selector */}
                    <div className="rounded-2xl border border-[#D4A359]/20 bg-[#0B110E]/65 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E6C385]">
                          Branch Spirit Guardian (Optional)
                        </span>
                        <span className="text-[10.5px] text-[#A6A095]">
                          Perches on their 3D limb
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSpiritAnimal("")}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                            spiritAnimal === ""
                              ? "bg-[#D4A359] text-[#090D0B]"
                              : "border border-[#F5F2EB]/15 text-[#A6A095] hover:border-[#D4A359]/45 hover:text-[#F5F2EB]"
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
                            onClick={() => setSpiritAnimal(key)}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                              spiritAnimal === key
                                ? "bg-[#D4A359] text-[#090D0B]"
                                : "border border-[#D4A359]/25 bg-[#D4A359]/8 text-[#E6C385] hover:bg-[#D4A359]/18"
                            }`}
                          >
                            {SPIRIT_ANIMAL_META[key].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Always-Visible Privacy Visibility & Error Bar */}
            <div className="border-t border-[#D4A359]/18 bg-[#0E1612]/90 px-6 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  {isPublicToFamily ? (
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-[#D4A359]" />
                  )}
                  <span className="text-[#F5F2EB]">
                    {isPublicToFamily
                      ? "Visible to all verified family members"
                      : "Private by default (relatives request access)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublicToFamily((v) => !v)}
                  className="shrink-0 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-3 py-1 text-[10.5px] font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 cursor-pointer"
                >
                  {isPublicToFamily ? "Make Private" : "Share with All Family"}
                </button>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/12 px-3 py-2 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="flex items-center justify-between border-t border-[#D4A359]/16 bg-[#0B110E]/75 px-6 py-4">
              {step > 1 ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F2EB]/15 px-4 py-2 text-xs font-medium text-[#F5F2EB] transition hover:border-[#D4A359]/45 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#A6A095]">
                  <Sparkles className="h-3.5 w-3.5 text-[#D4A359]" />
                  Syncs live to your shared family archive
                </span>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && !canProceedStep1}
                  onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A359] px-5 py-2 text-xs font-semibold text-[#090D0B] transition hover:bg-[#E6C385] disabled:opacity-40 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleFinish()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A359] px-5 py-2 text-xs font-semibold text-[#090D0B] shadow-[0_0_24px_rgba(212,163,89,0.35)] transition hover:bg-[#E6C385] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isSubmitting ? "Saving to Cloud..." : "Plant on the Tree"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
