import { FamilyArchiveExport, FamilyMember } from "@/types/family";

const LEGACY_ARCHIVE_KEY = "roots-and-echoes:archive:v1";
const ACCESS_CODE_KEY = "roots-and-echoes:family-code:v1";

/**
 * Purges any legacy cached family_members array from localStorage so visitors
 * always read the live, authoritative family tree from Supabase via GET /api/family.
 */
export function purgeLegacyLocalArchive(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_ARCHIVE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadSavedFamilyCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ACCESS_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveFamilyCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = code.trim();
    if (trimmed) {
      window.localStorage.setItem(ACCESS_CODE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(ACCESS_CODE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearSavedFamilyCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_CODE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function buildArchiveExport(members: FamilyMember[]): FamilyArchiveExport {
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    archiveName: "Roots & Echoes Family Archive",
    members,
  };
}

export function parseImportedArchive(jsonText: string): {
  members?: FamilyMember[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText) as Partial<FamilyArchiveExport> | FamilyMember[];
    const candidate = Array.isArray(parsed) ? parsed : parsed?.members;

    if (!Array.isArray(candidate) || candidate.length === 0) {
      return { error: "Archive file contains no family members." };
    }

    for (const item of candidate) {
      if (
        !item ||
        typeof item.id !== "string" ||
        typeof item.firstName !== "string" ||
        typeof item.lastName !== "string" ||
        typeof item.birthYear !== "number"
      ) {
        return { error: "One or more family member records are missing required fields." };
      }
    }

    return { members: candidate as FamilyMember[] };
  } catch {
    return { error: "Could not parse JSON file. Please select a valid Roots & Echoes backup." };
  }
}

export function estimateArchiveSizeKB(members: FamilyMember[]): number {
  try {
    const bytes = new Blob([JSON.stringify(members)]).size;
    return Math.max(1, Math.round(bytes / 1024));
  } catch {
    return 0;
  }
}
