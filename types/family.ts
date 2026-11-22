export type TreeLayoutMode = "organic" | "radial";

export type RelationshipLinkType =
  | "child"
  | "partner"
  | "parent"
  | "brother"
  | "sister";

export type SpiritAnimalType = "panther" | "bird" | "owl";

export type AccessStatus = "locked" | "pending" | "approved";

export type AccessRequestType = "view" | "claim";

export type AccessRequestStatus = "pending" | "approved" | "declined";

export const SPIRIT_ANIMAL_META: Record<
  SpiritAnimalType,
  { label: string; tagline: string }
> = {
  panther: {
    label: "Panther of Light",
    tagline: "Quiet strength & watchful grace",
  },
  bird: {
    label: "Songbird of Light",
    tagline: "Melody, renewal & open skies",
  },
  owl: {
    label: "Owl of Light",
    tagline: "Wisdom & nocturnal memory",
  },
};

export interface LifeMilestone {
  year: number;
  title: string;
  description: string;
}

export interface MemoryPhoto {
  id: string;
  url: string;
  caption: string;
  year?: number;
  location?: string;
}

export interface BeliefsProfile {
  coreValues: string[];
  philosophy: string;
  favoriteQuotes: string[];
  spiritualBeliefs: string;
  adviceForFuture: string;
}

export interface HealthProfile {
  bloodType?: string;
  longevityNotes: string;
  knownConditions: string[];
  lifestyleNotes: string;
  hereditaryGuidance: string;
}

export interface PersonaProfile {
  era: string;
  tone: string;
  traits: string[];
  greeting: string;
  suggestedPrompts: string[];
}

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  birthYear: number;
  passingYear?: number;
  birthPlace?: string;
  occupation?: string;
  generation: number;
  portraitUrl: string;
  spiritAnimal?: SpiritAnimalType;
  parentIds: string[];
  partnerIds: string[];
  childrenIds: string[];
  bio: string;
  milestones: LifeMilestone[];
  gallery: MemoryPhoto[];
  beliefs: BeliefsProfile;
  health: HealthProfile;
  persona: PersonaProfile;
  // Ownership & privacy metadata (server-enforced)
  ownerEmail?: string | null;
  submittedBy?: string | null;
  addedByName?: string | null;
  approvedViewerEmails?: string[];
  isPublicToFamily?: boolean;
  accessStatus?: AccessStatus;
  canEdit?: boolean;
  claimPending?: boolean;
}

export interface AccessRequestRecord {
  id: string;
  memberId: string;
  memberName: string;
  requesterEmail: string;
  requesterName?: string | null;
  requesterAvatarUrl?: string | null;
  requesterTreeMemberId?: string | null;
  requesterTreeMemberName?: string | null;
  note?: string | null;
  requestType: AccessRequestType;
  status: AccessRequestStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  mode?: "live" | "simulated";
}

export interface FamilyArchiveExport {
  version: string;
  exportedAt: string;
  archiveName: string;
  members: FamilyMember[];
}
