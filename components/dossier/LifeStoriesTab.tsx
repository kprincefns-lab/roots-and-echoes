"use client";

import { ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ImagePlus, MapPin, X } from "lucide-react";
import { FamilyMember, MemoryPhoto } from "@/types/family";

interface LifeStoriesTabProps {
  member: FamilyMember;
  onAddMemoryPhoto: (memberId: string, photo: MemoryPhoto) => void;
}

export function LifeStoriesTab({
  member,
  onAddMemoryPhoto,
}: LifeStoriesTabProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<MemoryPhoto | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMemory = () => {
    if (!previewUrl) return;
    const photo: MemoryPhoto = {
      id: `mem-${Date.now()}`,
      url: previewUrl,
      caption: caption.trim() || `Memory with ${member.firstName}`,
      year: year ? Number(year) : undefined,
    };
    onAddMemoryPhoto(member.id, photo);
    setPreviewUrl(null);
    setCaption("");
    setYear("");
    setShowUploadForm(false);
  };

  return (
    <div className="space-y-7 pb-6">
      {/* Narrative Biography */}
      <section>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
          Narrative Biography
        </h3>
        <p className="mt-3 text-[14.5px] leading-[1.75] text-[#F5F2EB]/90">
          {member.bio}
        </p>
      </section>

      {/* Life Milestones Timeline */}
      {member.milestones.length > 0 && (
        <section>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
            Key Life Milestones
          </h3>
          <div className="relative mt-4 space-y-5 pl-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[#D4A359]/60 before:via-[#D4A359]/25 before:to-transparent">
            {member.milestones.map((ms, idx) => (
              <div key={`${ms.year}-${idx}`} className="relative">
                <span className="absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full border border-[#E6C385] bg-[#090D0B] shadow-[0_0_10px_rgba(212,163,89,0.6)]" />
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-semibold tracking-wider text-[#D4A359]">
                    {ms.year}
                  </span>
                  <h4 className="font-editorial text-lg leading-snug text-[#F5F2EB]">
                    {ms.title}
                  </h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#A6A095]">
                  {ms.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Memory Photo Gallery */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#D4A359]">
            Memory Gallery ({member.gallery.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowUploadForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A359]/30 bg-[#D4A359]/10 px-3 py-1 text-[11px] font-medium text-[#E6C385] transition hover:bg-[#D4A359]/20 cursor-pointer"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {showUploadForm ? "Cancel" : "Add Memory"}
          </button>
        </div>

        {/* Inline Memory Uploader */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-[#D4A359]/25 bg-[#0B110E]/80 p-3.5 space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D4A359]/35 bg-[#121B16]/50 px-4 py-4 text-center transition hover:border-[#D4A359]/60">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Memory preview"
                      className="max-h-32 rounded-md object-cover"
                    />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 text-[#D4A359]" />
                      <span className="mt-1.5 text-xs text-[#F5F2EB]/80">
                        Click to choose a memory photo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption or story behind this photo..."
                    className="col-span-2 rounded-lg border border-[#D4A359]/20 bg-[#090D0B]/70 px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/60 focus:border-[#D4A359]/60 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year"
                    className="rounded-lg border border-[#D4A359]/20 bg-[#090D0B]/70 px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#A6A095]/60 focus:border-[#D4A359]/60 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!previewUrl}
                    onClick={handleSaveMemory}
                    className="rounded-full bg-[#D4A359] px-4 py-1.5 text-xs font-semibold text-[#090D0B] transition hover:bg-[#E6C385] disabled:opacity-40 cursor-pointer"
                  >
                    Save to Archive
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {member.gallery.length === 0 ? (
          <p className="mt-3 rounded-xl border border-[#D4A359]/12 bg-[#0B110E]/50 p-4 text-xs text-[#A6A095]">
            No archival photos added yet. Click &ldquo;Add Memory&rdquo; above to preserve a photograph.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {member.gallery.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group relative overflow-hidden rounded-xl border border-[#D4A359]/20 bg-[#0B110E] text-left transition hover:border-[#D4A359]/55 cursor-pointer"
              >
                <div className="aspect-[3/2] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-[11.5px] leading-snug text-[#F5F2EB]/90">
                    {photo.caption}
                  </p>
                  {(photo.year || photo.location) && (
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#D4A359]/80">
                      {photo.year && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {photo.year}
                        </span>
                      )}
                      {photo.location && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-2.5 w-2.5" />
                          {photo.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl overflow-hidden rounded-2xl border border-[#D4A359]/30 bg-[#0E1511] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                aria-label="Close photo preview"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-[#F5F2EB] transition hover:bg-black/85 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption}
                className="max-h-[70vh] w-full object-contain bg-[#090D0B]"
              />
              <div className="p-4">
                <p className="font-editorial text-xl text-[#F5F2EB]">
                  {lightboxPhoto.caption}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#D4A359]/80">
                  {lightboxPhoto.year && <span>{lightboxPhoto.year}</span>}
                  {lightboxPhoto.location && <span>· {lightboxPhoto.location}</span>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
