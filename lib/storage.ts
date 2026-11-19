import { FamilyArchiveExport, FamilyMember } from "@/types/family";
import { SEED_FAMILY } from "@/data/seedFamily";

const STORAGE_KEY = "roots-and-echoes:archive:v1";

export function loadFamilyArchive(): FamilyMember[] {
  if (typeof window === "undefined") {
    return SEED_FAMILY;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_FAMILY;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as FamilyMember[];
    }
    return SEED_FAMILY;
  } catch {
    return SEED_FAMILY;
  }
}

export function saveFamilyArchive(members: FamilyMember[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    return true;
  } catch {
    return false;
  }
}

export function resetFamilyArchive(): FamilyMember[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return SEED_FAMILY;
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
