import { NextRequest, NextResponse } from "next/server";
import { RelationshipLinkType } from "@/types/family";
import { getAuthenticatedSession } from "@/lib/supabaseServer";
import {
  extractCuratorCode,
  fetchAllFamilyMembers,
  getSupabaseAdmin,
  isCuratorCodeValid,
  projectMembersForViewer,
} from "@/lib/supabaseAdmin";

const VALID_RELATIONSHIPS = new Set<RelationshipLinkType>([
  "parent",
  "child",
  "partner",
  "brother",
  "sister",
]);

function isAncestorOf(
  possibleAncestorId: string,
  nodeId: string,
  byId: Map<string, { parentIds: string[] }>
): boolean {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    const rec = byId.get(curr);
    if (!rec) continue;
    for (const pid of rec.parentIds) {
      if (pid === possibleAncestorId) return true;
      queue.push(pid);
    }
  }
  return false;
}

/**
 * POST /api/family/connect
 * Links two existing family_members records:
 *   "Link [sourceId] as [relationship] of [targetId]"
 * Allowed for ANY authenticated family member (modifies relationship arrays only;
 * personal/private profile fields remain strictly owner/curator protected).
 */
export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on this server." },
      { status: 503 }
    );
  }

  const isCurator = isCuratorCodeValid(extractCuratorCode(request.headers));

  try {
    const body = (await request.json()) as {
      sourceId?: string;
      targetId?: string;
      relationship?: RelationshipLinkType;
    };

    const { sourceId, targetId, relationship } = body;

    if (!sourceId || !targetId || !relationship) {
      return NextResponse.json(
        { error: "sourceId, targetId, and relationship are required." },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: "A family member cannot be connected to themselves." },
        { status: 400 }
      );
    }

    if (!VALID_RELATIONSHIPS.has(relationship)) {
      return NextResponse.json(
        { error: "Unsupported relationship type." },
        { status: 400 }
      );
    }

    const { members, error: loadErr } = await fetchAllFamilyMembers(supabase);
    if (loadErr) {
      return NextResponse.json({ error: loadErr }, { status: 500 });
    }

    const byId = new Map(members.map((m) => [m.id, m]));
    const source = byId.get(sourceId);
    const target = byId.get(targetId);

    if (!source || !target) {
      return NextResponse.json(
        { error: "One or both selected relatives could not be found." },
        { status: 404 }
      );
    }

    const pendingUpdates = new Map<
      string,
      {
        parent_ids?: string[];
        partner_ids?: string[];
        children_ids?: string[];
        sibling_ids?: string[];
        generation?: number;
      }
    >();

    const queueUpdate = (
      id: string,
      patch: {
        parent_ids?: string[];
        partner_ids?: string[];
        children_ids?: string[];
        sibling_ids?: string[];
        generation?: number;
      }
    ) => {
      pendingUpdates.set(id, { ...(pendingUpdates.get(id) ?? {}), ...patch });
    };

    if (relationship === "parent") {
      // Source is Parent of Target -> prevent circular ancestry
      if (isAncestorOf(targetId, sourceId, byId)) {
        return NextResponse.json(
          {
            error: `Cannot make ${source.firstName} a parent of ${target.firstName} because ${target.firstName} is already an ancestor of ${source.firstName}.`,
          },
          { status: 400 }
        );
      }

      queueUpdate(targetId, {
        parent_ids: Array.from(new Set([...target.parentIds, sourceId])),
      });
      queueUpdate(sourceId, {
        children_ids: Array.from(new Set([...source.childrenIds, targetId])),
        ...(source.generation >= target.generation
          ? { generation: target.generation - 1 }
          : {}),
      });
    } else if (relationship === "child") {
      // Source is Child of Target -> prevent circular ancestry
      if (isAncestorOf(sourceId, targetId, byId)) {
        return NextResponse.json(
          {
            error: `Cannot make ${source.firstName} a child of ${target.firstName} because ${source.firstName} is already an ancestor of ${target.firstName}.`,
          },
          { status: 400 }
        );
      }

      queueUpdate(sourceId, {
        parent_ids: Array.from(new Set([...source.parentIds, targetId])),
        ...(source.generation <= target.generation
          ? { generation: target.generation + 1 }
          : {}),
      });
      queueUpdate(targetId, {
        children_ids: Array.from(new Set([...target.childrenIds, sourceId])),
      });
    } else if (relationship === "partner") {
      queueUpdate(sourceId, {
        partner_ids: Array.from(new Set([...source.partnerIds, targetId])),
      });
      queueUpdate(targetId, {
        partner_ids: Array.from(new Set([...target.partnerIds, sourceId])),
      });
    } else if (relationship === "brother" || relationship === "sister") {
      // Share/merge any existing parent_ids between both siblings AND link sibling_ids symmetrically
      const mergedParents = Array.from(
        new Set([...source.parentIds, ...target.parentIds])
      ).filter((pid) => pid !== sourceId && pid !== targetId);

      const sourceSiblings = Array.from(
        new Set([...(source.siblingIds ?? []), targetId])
      );
      const targetSiblings = Array.from(
        new Set([...(target.siblingIds ?? []), sourceId])
      );

      queueUpdate(sourceId, {
        parent_ids: mergedParents,
        sibling_ids: sourceSiblings,
        generation: target.generation,
      });
      queueUpdate(targetId, {
        parent_ids: mergedParents,
        sibling_ids: targetSiblings,
      });

      // Symmetrically update each shared parent's children_ids
      for (const pid of mergedParents) {
        const parent = byId.get(pid);
        if (parent) {
          queueUpdate(pid, {
            children_ids: Array.from(
              new Set([...parent.childrenIds, sourceId, targetId])
            ),
          });
        }
      }
    }

    // Apply all relationship-array updates to Supabase
    for (const [id, patch] of pendingUpdates.entries()) {
      const { error: updErr } = await supabase
        .from("family_members")
        .update(patch)
        .eq("id", id);
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    }

    // Normalize generations so the earliest generation stays at 0
    const { members: afterUpdate, error: refetchErr } =
      await fetchAllFamilyMembers(supabase);
    if (refetchErr) {
      return NextResponse.json({ error: refetchErr }, { status: 500 });
    }

    const minGen =
      afterUpdate.length > 0
        ? Math.min(...afterUpdate.map((m) => m.generation))
        : 0;
    if (minGen !== 0) {
      for (const m of afterUpdate) {
        await supabase
          .from("family_members")
          .update({ generation: m.generation - minGen })
          .eq("id", m.id);
      }
    }

    const finalFetch = await fetchAllFamilyMembers(supabase);
    const projected = await projectMembersForViewer(
      supabase,
      finalFetch.members,
      session.email,
      isCurator
    );

    return NextResponse.json({
      ok: true,
      members: projected,
      source: "supabase",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect relatives.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
