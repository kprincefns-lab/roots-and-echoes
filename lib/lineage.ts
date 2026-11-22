import { FamilyMember } from "@/types/family";

export type Vec3 = [number, number, number];

export interface BranchEdge {
  id: string;
  fromId: string;
  toId: string;
  kind: "lineage" | "partner" | "sibling";
}

export interface ComputedTreeLayout {
  organic: Record<string, Vec3>;
  radial: Record<string, Vec3>;
  edges: BranchEdge[];
  generations: number[];
}

export function getFullName(member: FamilyMember): string {
  return `${member.firstName} ${member.lastName}`;
}

export function getMemberLifespanLabel(member: FamilyMember): string {
  const currentYear = new Date().getFullYear();
  if (member.passingYear) {
    const years = Math.max(0, member.passingYear - member.birthYear);
    return `${member.birthYear} – ${member.passingYear} · ${years} yrs`;
  }
  const age = Math.max(0, currentYear - member.birthYear);
  return `b. ${member.birthYear} · Age ${age}`;
}

export function getGenerationLabel(gen: number): string {
  const labels = ["Gen I · Roots", "Gen II · Limbs", "Gen III · Boughs", "Gen IV · Canopy", "Gen V · Crown"];
  return labels[gen] ?? `Gen ${gen + 1}`;
}

/**
 * Returns the set of member IDs in the selected member's direct lineage:
 * the member themselves, all ancestors, all descendants, immediate partners, and explicit siblings.
 */
export function getDirectLineageIds(
  selectedId: string | null,
  members: FamilyMember[]
): Set<string> {
  if (!selectedId) return new Set();

  const byId = new Map(members.map((m) => [m.id, m]));
  const result = new Set<string>([selectedId]);

  // Traverse upward to all ancestors
  const upQueue = [selectedId];
  while (upQueue.length > 0) {
    const curr = upQueue.shift()!;
    const node = byId.get(curr);
    if (!node) continue;
    for (const pid of node.parentIds) {
      if (!result.has(pid) && byId.has(pid)) {
        result.add(pid);
        upQueue.push(pid);
      }
    }
  }

  // Traverse downward to all descendants
  const downQueue = [selectedId];
  while (downQueue.length > 0) {
    const curr = downQueue.shift()!;
    const node = byId.get(curr);
    if (!node) continue;
    for (const cid of node.childrenIds) {
      if (!result.has(cid) && byId.has(cid)) {
        result.add(cid);
        downQueue.push(cid);
      }
    }
  }

  // Include immediate partner(s) and explicit sibling(s) of the selected member
  const selected = byId.get(selectedId);
  if (selected) {
    for (const partnerId of selected.partnerIds) {
      if (byId.has(partnerId)) {
        result.add(partnerId);
      }
    }
    for (const sibId of selected.siblingIds ?? []) {
      if (byId.has(sibId)) {
        result.add(sibId);
      }
    }
  }

  return result;
}

/**
 * Computes both 3D Organic Tree coordinates and Radial Tree of Life coordinates
 * dynamically for any family graph (including user-added generations).
 */
export function computeTreeLayouts(members: FamilyMember[]): ComputedTreeLayout {
  const byId = new Map(members.map((m) => [m.id, m]));
  const organic: Record<string, Vec3> = {};
  const radial: Record<string, Vec3> = {};

  // Group members by generation
  const genMap = new Map<number, FamilyMember[]>();
  for (const m of members) {
    const list = genMap.get(m.generation) ?? [];
    list.push(m);
    genMap.set(m.generation, list);
  }

  const generations = Array.from(genMap.keys()).sort((a, b) => a - b);

  // Order each generation so partners sit adjacent and children align near parents
  const orderedByGen = new Map<number, FamilyMember[]>();

  for (const gen of generations) {
    const raw = [...(genMap.get(gen) ?? [])];
    const visited = new Set<string>();
    const ordered: FamilyMember[] = [];

    // Sort by parent average X (if parents already laid out) or birthYear
    raw.sort((a, b) => {
      const ax = averageParentX(a, organic);
      const bx = averageParentX(b, organic);
      if (ax !== null && bx !== null && Math.abs(ax - bx) > 0.01) {
        return ax - bx;
      }
      return a.birthYear - b.birthYear;
    });

    for (const m of raw) {
      if (visited.has(m.id)) continue;
      visited.add(m.id);
      ordered.push(m);

      // Keep same-generation partner right beside them
      for (const pid of m.partnerIds) {
        const partner = byId.get(pid);
        if (partner && partner.generation === gen && !visited.has(partner.id)) {
          visited.add(partner.id);
          ordered.push(partner);
        }
      }
    }

    orderedByGen.set(gen, ordered);

    // ─── ORGANIC 3D TREE POSITIONS ───
    const count = ordered.length;
    const minGen = generations[0] ?? 0;
    const levelIndex = gen - minGen;
    const baseY = -1.9 + levelIndex * 3.05;
    const spreadRadius = levelIndex === 0 ? 1.5 : 2.9 + levelIndex * 2.15;

    ordered.forEach((member, idx) => {
      if (count === 1) {
        organic[member.id] = [0, baseY, 0];
      } else if (levelIndex === 0 && count === 2) {
        const sign = idx === 0 ? -1 : 1;
        organic[member.id] = [sign * 1.55, baseY + (idx === 0 ? 0.1 : -0.05), sign * 0.35];
      } else {
        // Organic horizontal fan with sculpted volumetric Z curvature & arched dome crown
        const t = count > 1 ? idx / (count - 1) : 0.5;
        const centered = (t - 0.5) * 2; // -1 to 1
        const x = centered * spreadRadius * 1.42;
        const waveZ =
          Math.sin(centered * Math.PI * 1.15 + levelIndex * 0.95) * (1.35 + levelIndex * 0.6) +
          (idx % 2 === 0 ? 0.42 : -0.42);
        const domeArch = (1 - centered * centered * 0.55) * (0.65 + levelIndex * 0.18);
        const archY = baseY + domeArch;
        organic[member.id] = [x, archY, waveZ];
      }
    });

    // ─── RADIAL "TREE OF LIFE" POSITIONS ───
    const ringRadius = levelIndex === 0 ? (count <= 1 ? 0 : 1.6) : 3.2 + levelIndex * 3.15;
    const angleOffset = levelIndex * 0.32 - Math.PI / 2;

    ordered.forEach((member, idx) => {
      const angle = angleOffset + (idx / Math.max(1, count)) * Math.PI * 2;
      const rx = Math.cos(angle) * ringRadius;
      const rz = Math.sin(angle) * ringRadius;
      // Subtle inverted amphitheater dome so inner roots sit gently elevated/anchored
      const ry = -levelIndex * 0.45 + 0.8;
      radial[member.id] = [rx, ry, rz];
    });
  }

  // ─── BUILD DEDUPLICATED EDGES ───
  const edges: BranchEdge[] = [];
  const seenPartners = new Set<string>();
  const seenLineage = new Set<string>();
  const seenSiblings = new Set<string>();

  for (const m of members) {
    // Parent -> Child edges
    for (const cid of m.childrenIds) {
      if (!byId.has(cid)) continue;
      const key = `${m.id}->${cid}`;
      if (!seenLineage.has(key)) {
        seenLineage.add(key);
        edges.push({
          id: `lin-${key}`,
          fromId: m.id,
          toId: cid,
          kind: "lineage",
        });
      }
    }

    // Also ensure child's parentIds are captured if childrenIds was asymmetric
    for (const pid of m.parentIds) {
      if (!byId.has(pid)) continue;
      const key = `${pid}->${m.id}`;
      if (!seenLineage.has(key)) {
        seenLineage.add(key);
        edges.push({
          id: `lin-${key}`,
          fromId: pid,
          toId: m.id,
          kind: "lineage",
        });
      }
    }

    // Partner edges
    for (const pid of m.partnerIds) {
      if (!byId.has(pid)) continue;
      const sorted = [m.id, pid].sort().join("<->");
      if (!seenPartners.has(sorted)) {
        seenPartners.add(sorted);
        edges.push({
          id: `prt-${sorted}`,
          fromId: m.id,
          toId: pid,
          kind: "partner",
        });
      }
    }

    // Explicit Sibling edges (connects siblings on the 3D tree even when parents aren't added yet)
    for (const sid of m.siblingIds ?? []) {
      const sibling = byId.get(sid);
      if (!sibling) continue;
      const sorted = [m.id, sid].sort().join("~");
      if (seenSiblings.has(sorted)) continue;
      seenSiblings.add(sorted);

      const sharesParent = m.parentIds.some((pid) =>
        sibling.parentIds.includes(pid)
      );
      if (!sharesParent) {
        edges.push({
          id: `sib-${sorted}`,
          fromId: m.id,
          toId: sid,
          kind: "sibling",
        });
      }
    }
  }

  return { organic, radial, edges, generations };
}

function averageParentX(
  member: FamilyMember,
  positions: Record<string, Vec3>
): number | null {
  const xs = member.parentIds
    .map((pid) => positions[pid]?.[0])
    .filter((v): v is number => typeof v === "number");
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Normalizes generation indices so the oldest generation is always 0.
 */
export function normalizeGenerations(members: FamilyMember[]): FamilyMember[] {
  if (members.length === 0) return members;
  const minGen = Math.min(...members.map((m) => m.generation));
  if (minGen === 0) return members;
  return members.map((m) => ({
    ...m,
    generation: m.generation - minGen,
  }));
}
