import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { FamilyMember, SpiritAnimalType } from "@/types/family";

export interface FamilyMemberRow {
  id: string;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  birth_year: number;
  passing_year: number | null;
  birth_place: string | null;
  occupation: string | null;
  generation: number;
  portrait_url: string;
  spirit_animal: SpiritAnimalType | null;
  parent_ids: string[];
  partner_ids: string[];
  children_ids: string[];
  bio: string;
  milestones: FamilyMember["milestones"];
  gallery: FamilyMember["gallery"];
  beliefs: FamilyMember["beliefs"];
  health: FamilyMember["health"];
  persona: FamilyMember["persona"];
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function rowToFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    maidenName: row.maiden_name ?? undefined,
    birthYear: row.birth_year,
    passingYear: row.passing_year ?? undefined,
    birthPlace: row.birth_place ?? undefined,
    occupation: row.occupation ?? undefined,
    generation: row.generation,
    portraitUrl: row.portrait_url,
    spiritAnimal: row.spirit_animal ?? undefined,
    parentIds: Array.isArray(row.parent_ids) ? row.parent_ids : [],
    partnerIds: Array.isArray(row.partner_ids) ? row.partner_ids : [],
    childrenIds: Array.isArray(row.children_ids) ? row.children_ids : [],
    bio: row.bio ?? "",
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    beliefs: row.beliefs,
    health: row.health,
    persona: row.persona,
  };
}

export function familyMemberToRow(member: FamilyMember): FamilyMemberRow {
  return {
    id: member.id,
    first_name: member.firstName,
    last_name: member.lastName,
    maiden_name: member.maidenName ?? null,
    birth_year: member.birthYear,
    passing_year: member.passingYear ?? null,
    birth_place: member.birthPlace ?? null,
    occupation: member.occupation ?? null,
    generation: member.generation,
    portrait_url: member.portraitUrl,
    spirit_animal: member.spiritAnimal ?? null,
    parent_ids: member.parentIds,
    partner_ids: member.partnerIds,
    children_ids: member.childrenIds,
    bio: member.bio,
    milestones: member.milestones,
    gallery: member.gallery,
    beliefs: member.beliefs,
    health: member.health,
    persona: member.persona,
  };
}

/**
 * Uploads a raster base64 data URL (JPEG/PNG/WebP/GIF) to the Supabase `family-media`
 * storage bucket and returns its public URL. Passes through existing HTTP or inline SVG URLs.
 */
export async function maybeUploadMediaToBucket(
  supabase: SupabaseClient,
  dataOrUrl: string,
  pathPrefix: string
): Promise<string> {
  const match = dataOrUrl.match(
    /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i
  );
  if (!match) return dataOrUrl;

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
  const filePath = `${pathPrefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}.${ext}`;

  const buffer = Buffer.from(base64Data, "base64");
  const { error } = await supabase.storage
    .from("family-media")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    // Graceful fallback to inline data URL if storage upload fails
    return dataOrUrl;
  }

  const { data } = supabase.storage.from("family-media").getPublicUrl(filePath);
  return data.publicUrl || dataOrUrl;
}

export function verifyAccessCode(
  suppliedCode: string | null,
  requireAdmin = false
): { ok: boolean; error?: string } {
  const inviteCode = process.env.FAMILY_INVITE_CODE?.trim();
  const adminCode = process.env.ADMIN_CURATOR_CODE?.trim();

  if (requireAdmin) {
    if (!adminCode) return { ok: true };
    if (suppliedCode?.trim() === adminCode) return { ok: true };
    return {
      ok: false,
      error: "Admin curator code required to reset or overwrite the archive.",
    };
  }

  if (!inviteCode && !adminCode) return { ok: true };
  const clean = suppliedCode?.trim();
  if (clean && (clean === inviteCode || clean === adminCode)) {
    return { ok: true };
  }
  return {
    ok: false,
    error: "Please enter your Family Invite Code in Settings to save changes to the cloud archive.",
  };
}
