import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AccessRequestRecord,
  AccessRequestStatus,
  AccessRequestType,
  AccessStatus,
  FamilyMember,
  MemoryPhoto,
  SpiritAnimalType,
} from "@/types/family";

const MEDIA_PREFIX = "family-media:";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

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
  sibling_ids?: string[] | null;
  bio: string;
  milestones: FamilyMember["milestones"];
  gallery: FamilyMember["gallery"];
  beliefs: FamilyMember["beliefs"];
  health: FamilyMember["health"];
  persona: FamilyMember["persona"];
  owner_email?: string | null;
  submitted_by?: string | null;
  approved_viewer_emails?: string[] | null;
  is_public_to_family?: boolean | null;
}

export interface AccessRequestRow {
  id: string;
  member_id: string;
  requester_email: string;
  requester_name: string | null;
  requester_avatar_url?: string | null;
  note: string | null;
  request_type?: AccessRequestType | null;
  status: AccessRequestStatus;
  created_at: string;
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
    siblingIds: Array.isArray(row.sibling_ids) ? row.sibling_ids : [],
    bio: row.bio ?? "",
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    beliefs: row.beliefs,
    health: row.health,
    persona: row.persona,
    ownerEmail: row.owner_email ? row.owner_email.toLowerCase() : null,
    submittedBy: row.submitted_by ? row.submitted_by.toLowerCase() : null,
    approvedViewerEmails: Array.isArray(row.approved_viewer_emails)
      ? row.approved_viewer_emails.map((e) => e.toLowerCase())
      : [],
    isPublicToFamily: Boolean(row.is_public_to_family),
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
    sibling_ids: member.siblingIds ?? [],
    bio: member.bio,
    milestones: member.milestones,
    gallery: member.gallery,
    beliefs: member.beliefs,
    health: member.health,
    persona: member.persona,
    owner_email: member.ownerEmail ? member.ownerEmail.toLowerCase() : null,
    submitted_by: member.submittedBy ? member.submittedBy.toLowerCase() : null,
    approved_viewer_emails: (member.approvedViewerEmails ?? []).map((e) =>
      e.toLowerCase()
    ),
    is_public_to_family: Boolean(member.isPublicToFamily),
  };
}

export function rowToAccessRequest(
  row: AccessRequestRow,
  memberNameMap: Map<string, string>,
  emailToTreeMemberMap?: Map<string, { id: string; name: string }>
): AccessRequestRecord {
  const email = row.requester_email.toLowerCase();
  const linkedProfile = emailToTreeMemberMap?.get(email) ?? null;

  return {
    id: row.id,
    memberId: row.member_id,
    memberName: memberNameMap.get(row.member_id) ?? row.member_id,
    requesterEmail: email,
    requesterName: row.requester_name,
    requesterAvatarUrl: row.requester_avatar_url ?? null,
    requesterTreeMemberId: linkedProfile?.id ?? null,
    requesterTreeMemberName: linkedProfile?.name ?? null,
    note: row.note,
    requestType: row.request_type === "claim" ? "claim" : "view",
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchAllFamilyMembers(
  supabase: SupabaseClient
): Promise<{ members: FamilyMember[]; error?: string }> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("generation", { ascending: true })
    .order("birth_year", { ascending: true });

  if (error) {
    return { members: [], error: error.message };
  }

  return {
    members: ((data ?? []) as FamilyMemberRow[]).map(rowToFamilyMember),
  };
}

/**
 * Extracts a private storage path from either `family-media:<path>` or a legacy
 * Supabase Storage URL pointing to the `family-media` bucket.
 */
function extractPrivateMediaPath(value: string): string | null {
  if (!value) return null;
  if (value.startsWith(MEDIA_PREFIX)) {
    return value.slice(MEDIA_PREFIX.length);
  }
  const storageMatch = value.match(
    /\/storage\/v1\/object\/(?:public|sign)\/family-media\/([^?]+)/i
  );
  if (storageMatch) {
    return decodeURIComponent(storageMatch[1]);
  }
  return null;
}

/**
 * Uploads a raster base64 data URL to the private `family-media` bucket and returns
 * a stable `family-media:<path>` storage pointer (never a permanent public URL).
 */
export async function maybeUploadMediaToPrivateBucket(
  supabase: SupabaseClient,
  dataOrUrl: string,
  pathPrefix: string
): Promise<string> {
  // Normalize existing signed/public URLs back to a clean storage pointer
  const existingPath = extractPrivateMediaPath(dataOrUrl);
  if (existingPath) {
    return `${MEDIA_PREFIX}${existingPath}`;
  }

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
    throw new Error(`Failed to upload image to family-media: ${error.message}`);
  }

  return `${MEDIA_PREFIX}${filePath}`;
}

/**
 * Converts a stored `family-media:<path>` pointer into a 1-hour signed URL.
 */
export async function resolveSignedMediaUrl(
  supabase: SupabaseClient,
  storedValue: string
): Promise<string> {
  const path = extractPrivateMediaPath(storedValue);
  if (!path) return storedValue;

  const { data, error } = await supabase.storage
    .from("family-media")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return storedValue;
  }
  return data.signedUrl;
}

/**
 * Server-enforced privacy projection:
 * - Full Access: signs private media URLs and returns full dossier.
 * - Locked / Pending: strips all sensitive personal fields on the server, returning
 *   only name, lineage graph edges, ownership flag, and accessStatus.
 */
export async function projectMembersForViewer(
  supabase: SupabaseClient,
  members: FamilyMember[],
  viewerEmail: string,
  isCurator: boolean
): Promise<FamilyMember[]> {
  const normalizedViewer = viewerEmail.trim().toLowerCase();

  // Fetch this viewer's access requests to compute locked vs pending state
  const { data: reqData } = await supabase
    .from("access_requests")
    .select("member_id, status, request_type")
    .eq("requester_email", normalizedViewer);

  const viewReqByMember = new Map<string, AccessRequestStatus>();
  const claimPendingByMember = new Set<string>();

  for (const r of (reqData ?? []) as Array<{
    member_id: string;
    status: AccessRequestStatus;
    request_type?: AccessRequestType | null;
  }>) {
    if (r.request_type === "claim" && r.status === "pending") {
      claimPendingByMember.add(r.member_id);
    } else {
      viewReqByMember.set(r.member_id, r.status);
    }
  }

  // Cross-reference owner emails to a human-readable creator name on the tree
  const ownerEmailToName = new Map<string, string>();
  for (const m of members) {
    if (m.ownerEmail) {
      const key = m.ownerEmail.toLowerCase();
      if (!ownerEmailToName.has(key)) {
        ownerEmailToName.set(key, `${m.firstName} ${m.lastName}`);
      }
    }
  }

  return Promise.all(
    members.map(async (member) => {
      const owner = member.ownerEmail?.toLowerCase() ?? null;
      const addedByName = owner
        ? ownerEmailToName.get(owner) ?? owner.split("@")[0]
        : "Family Curator";
      const approvedList = (member.approvedViewerEmails ?? []).map((e) =>
        e.toLowerCase()
      );
      const isOwner = Boolean(owner && owner === normalizedViewer);
      const canEdit = isCurator || isOwner;
      const hasFullAccess =
        isCurator ||
        isOwner ||
        Boolean(member.isPublicToFamily) ||
        approvedList.includes(normalizedViewer);

      if (hasFullAccess) {
        const signedPortrait = await resolveSignedMediaUrl(
          supabase,
          member.portraitUrl
        );
        const signedGallery: MemoryPhoto[] = await Promise.all(
          (member.gallery ?? []).map(async (photo) => ({
            ...photo,
            url: await resolveSignedMediaUrl(supabase, photo.url),
          }))
        );

        return {
          ...member,
          portraitUrl: signedPortrait,
          gallery: signedGallery,
          addedByName,
          accessStatus: "approved" as AccessStatus,
          canEdit,
          claimPending: claimPendingByMember.has(member.id),
        };
      }

      // Locked / Pending: strip ALL sensitive personal fields on the server
      const reqStatus = viewReqByMember.get(member.id);
      const accessStatus: AccessStatus =
        reqStatus === "pending" ? "pending" : "locked";

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        generation: member.generation,
        birthYear: 0,
        portraitUrl: "",
        parentIds: member.parentIds,
        partnerIds: member.partnerIds,
        childrenIds: member.childrenIds,
        siblingIds: member.siblingIds ?? [],
        bio: "",
        milestones: [],
        gallery: [],
        beliefs: {
          coreValues: [],
          philosophy: "",
          favoriteQuotes: [],
          spiritualBeliefs: "",
          adviceForFuture: "",
        },
        health: {
          longevityNotes: "",
          knownConditions: [],
          lifestyleNotes: "",
          hereditaryGuidance: "",
        },
        persona: {
          era: "",
          tone: "",
          traits: [],
          greeting: "",
          suggestedPrompts: [],
        },
        ownerEmail: owner,
        addedByName,
        isPublicToFamily: false,
        accessStatus,
        canEdit: false,
        claimPending: claimPendingByMember.has(member.id),
      };
    })
  );
}

export function verifyInviteCodeHeader(suppliedCode: string | null): boolean {
  const inviteCode = process.env.FAMILY_INVITE_CODE?.trim();
  const adminCode = process.env.ADMIN_CURATOR_CODE?.trim();
  if (!inviteCode && !adminCode) return true;
  const clean = suppliedCode?.trim();
  return Boolean(clean && (clean === inviteCode || clean === adminCode));
}

export function isCuratorCodeValid(suppliedCode: string | null): boolean {
  const adminCode = process.env.ADMIN_CURATOR_CODE?.trim();
  if (!adminCode) return false;
  return Boolean(suppliedCode && suppliedCode.trim() === adminCode);
}

export function extractCuratorCode(headers: Headers): string | null {
  return (
    headers.get("x-curator-code") ??
    headers.get("x-family-code") ??
    headers.get("x-access-code")
  );
}
