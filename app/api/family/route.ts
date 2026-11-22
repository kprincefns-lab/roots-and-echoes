import { NextRequest, NextResponse } from "next/server";
import { SEED_FAMILY } from "@/data/seedFamily";
import {
  FamilyMember,
  MemoryPhoto,
  RelationshipLinkType,
  SpiritAnimalType,
} from "@/types/family";
import { getAuthenticatedSession } from "@/lib/supabaseServer";
import {
  extractCuratorCode,
  familyMemberToRow,
  FamilyMemberRow,
  fetchAllFamilyMembers,
  getSupabaseAdmin,
  isCuratorCodeValid,
  maybeUploadMediaToPrivateBucket,
  projectMembersForViewer,
  rowToFamilyMember,
} from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
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
  const { members: rawMembers, error } = await fetchAllFamilyMembers(supabase);
  if (error) {
    return NextResponse.json(
      { error: `Failed to load family archive: ${error}` },
      { status: 500 }
    );
  }

  const projected = await projectMembersForViewer(
    supabase,
    rawMembers,
    session.email,
    isCurator
  );

  return NextResponse.json(
    {
      members: projected,
      source: "supabase",
      viewerEmail: session.email,
      isCurator,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

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
      action?: "seed-demo";
      replaceAll?: boolean;
      members?: FamilyMember[];
      newMember?: FamilyMember;
      linkTargetId?: string;
      linkType?: RelationshipLinkType;
    };

    // 1. Explicit Curator action: Load Demo Seed Data
    if (body.action === "seed-demo") {
      if (!isCurator) {
        return NextResponse.json(
          { error: "Admin Curator Code required to load demo seed data." },
          { status: 403 }
        );
      }

      const { error: delErr } = await supabase
        .from("family_members")
        .delete()
        .neq("id", "");
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      const seedRows = SEED_FAMILY.map((m) =>
        familyMemberToRow({
          ...m,
          ownerEmail: null,
          submittedBy: session.email,
          approvedViewerEmails: [],
          isPublicToFamily: false,
        })
      );
      const { error: seedErr } = await supabase
        .from("family_members")
        .upsert(seedRows, { onConflict: "id" });
      if (seedErr) {
        return NextResponse.json({ error: seedErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      if (fresh.error) {
        return NextResponse.json({ error: fresh.error }, { status: 500 });
      }
      const projected = await projectMembersForViewer(
        supabase,
        fresh.members,
        session.email,
        isCurator
      );
      return NextResponse.json({
        ok: true,
        members: projected,
        source: "supabase",
      });
    }

    // 2. Curator full archive import (replaceAll)
    if (body.replaceAll && Array.isArray(body.members)) {
      if (!isCurator) {
        return NextResponse.json(
          { error: "Admin Curator Code required to overwrite the cloud archive." },
          { status: 403 }
        );
      }

      const prepared = await Promise.all(
        body.members.map(async (member) => {
          const portraitUrl = await maybeUploadMediaToPrivateBucket(
            supabase,
            member.portraitUrl,
            `portraits/${member.id}`
          );
          const gallery: MemoryPhoto[] = await Promise.all(
            (member.gallery ?? []).map(async (photo) => ({
              ...photo,
              url: await maybeUploadMediaToPrivateBucket(
                supabase,
                photo.url,
                `memories/${member.id}`
              ),
            }))
          );
          return {
            ...member,
            portraitUrl,
            gallery,
            ownerEmail: member.ownerEmail ?? null,
            submittedBy: member.submittedBy ?? session.email,
            approvedViewerEmails: member.approvedViewerEmails ?? [],
            isPublicToFamily: Boolean(member.isPublicToFamily),
          };
        })
      );

      const { error: delErr } = await supabase
        .from("family_members")
        .delete()
        .neq("id", "");
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      const { error: upsertErr } = await supabase
        .from("family_members")
        .upsert(prepared.map(familyMemberToRow), { onConflict: "id" });
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      const projected = await projectMembersForViewer(
        supabase,
        fresh.members,
        session.email,
        isCurator
      );
      return NextResponse.json({
        ok: true,
        members: projected,
        source: "supabase",
      });
    }

    // 3. Authenticated family member creating a new relative (server-stamped ownership)
    if (!body.newMember) {
      return NextResponse.json(
        { error: "Missing newMember payload." },
        { status: 400 }
      );
    }

    const incoming = body.newMember;
    const portraitUrl = await maybeUploadMediaToPrivateBucket(
      supabase,
      incoming.portraitUrl,
      `portraits/${incoming.id}`
    );
    const gallery: MemoryPhoto[] = await Promise.all(
      (incoming.gallery ?? []).map(async (photo) => ({
        ...photo,
        url: await maybeUploadMediaToPrivateBucket(
          supabase,
          photo.url,
          `memories/${incoming.id}`
        ),
      }))
    );

    const { members: existingMembers, error: loadErr } =
      await fetchAllFamilyMembers(supabase);
    if (loadErr) {
      return NextResponse.json({ error: loadErr }, { status: 500 });
    }

    const target = body.linkTargetId
      ? existingMembers.find((m) => m.id === body.linkTargetId)
      : undefined;
    const linkType = body.linkType ?? "child";

    let generation = target ? target.generation : 0;
    const parentIds: string[] = [];
    const partnerIds: string[] = [];
    const childrenIds: string[] = [];
    const edgeUpdates: Array<{
      id: string;
      parent_ids?: string[];
      partner_ids?: string[];
      children_ids?: string[];
    }> = [];

    if (target) {
      if (linkType === "child") {
        generation = target.generation + 1;
        parentIds.push(target.id);
        edgeUpdates.push({
          id: target.id,
          children_ids: Array.from(new Set([...target.childrenIds, incoming.id])),
        });
        // Also link co-parent partner(s) symmetrically
        for (const pid of target.partnerIds) {
          const coParent = existingMembers.find((m) => m.id === pid);
          if (coParent) {
            parentIds.push(coParent.id);
            edgeUpdates.push({
              id: coParent.id,
              children_ids: Array.from(
                new Set([...coParent.childrenIds, incoming.id])
              ),
            });
          }
        }
      } else if (linkType === "partner") {
        generation = target.generation;
        partnerIds.push(target.id);
        edgeUpdates.push({
          id: target.id,
          partner_ids: Array.from(new Set([...target.partnerIds, incoming.id])),
        });
      } else if (linkType === "parent") {
        generation = target.generation - 1;
        childrenIds.push(target.id);
        edgeUpdates.push({
          id: target.id,
          parent_ids: Array.from(new Set([...target.parentIds, incoming.id])),
        });
      }
    }

    // Server-enforced ownership: NEVER trust client-supplied ownerEmail
    const newRecord: FamilyMember = {
      ...incoming,
      generation,
      portraitUrl,
      gallery,
      parentIds: Array.from(new Set(parentIds)),
      partnerIds: Array.from(new Set(partnerIds)),
      childrenIds: Array.from(new Set(childrenIds)),
      ownerEmail: session.email,
      submittedBy: session.email,
      approvedViewerEmails: [],
      isPublicToFamily: Boolean(incoming.isPublicToFamily),
    };

    const { error: insertErr } = await supabase
      .from("family_members")
      .insert(familyMemberToRow(newRecord));

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Apply symmetric lineage-edge updates without altering other owners' private fields
    for (const upd of edgeUpdates) {
      const { id, ...fields } = upd;
      await supabase.from("family_members").update(fields).eq("id", id);
    }

    // Normalize generations if a new parent was added above Generation 0
    if (generation < 0) {
      const shift = Math.abs(generation);
      const { members: allNow } = await fetchAllFamilyMembers(supabase);
      for (const m of allNow) {
        await supabase
          .from("family_members")
          .update({ generation: m.generation + shift })
          .eq("id", m.id);
      }
    }

    const fresh = await fetchAllFamilyMembers(supabase);
    if (fresh.error) {
      return NextResponse.json({ error: fresh.error }, { status: 500 });
    }

    const projected = await projectMembersForViewer(
      supabase,
      fresh.members,
      session.email,
      isCurator
    );

    return NextResponse.json({
      ok: true,
      members: projected,
      createdId: newRecord.id,
      source: "supabase",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save to Supabase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
      memberId?: string;
      spiritAnimal?: SpiritAnimalType | null;
      isPublicToFamily?: boolean;
      addMemoryPhoto?: MemoryPhoto;
      updates?: Partial<FamilyMember>;
    };

    const targetId = body.memberId ?? body.updates?.id;
    if (!targetId) {
      return NextResponse.json(
        { error: "Missing memberId." },
        { status: 400 }
      );
    }

    const { data: existingRow, error: fetchErr } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", targetId)
      .single();

    if (fetchErr || !existingRow) {
      return NextResponse.json(
        { error: "Family member not found." },
        { status: 404 }
      );
    }

    const existing = rowToFamilyMember(existingRow as FamilyMemberRow);
    const isOwner =
      Boolean(existing.ownerEmail) &&
      existing.ownerEmail!.toLowerCase() === session.email;

    if (!isCurator && !isOwner) {
      return NextResponse.json(
        { error: "Only the profile creator or Admin Curator can edit this record." },
        { status: 403 }
      );
    }

    const patchFields: Record<string, unknown> = {};

    if (body.addMemoryPhoto) {
      const uploadedPtr = await maybeUploadMediaToPrivateBucket(
        supabase,
        body.addMemoryPhoto.url,
        `memories/${targetId}`
      );
      const savedPhoto: MemoryPhoto = {
        ...body.addMemoryPhoto,
        url: uploadedPtr,
      };
      patchFields.gallery = [savedPhoto, ...(existing.gallery ?? [])];
    }

    if ("spiritAnimal" in body) {
      patchFields.spirit_animal = body.spiritAnimal ?? null;
    }

    if (typeof body.isPublicToFamily === "boolean") {
      patchFields.is_public_to_family = body.isPublicToFamily;
    }

    if (body.updates) {
      const u = body.updates;
      if (typeof u.firstName === "string" && u.firstName.trim()) {
        patchFields.first_name = u.firstName.trim();
      }
      if (typeof u.lastName === "string" && u.lastName.trim()) {
        patchFields.last_name = u.lastName.trim();
      }
      if ("maidenName" in u) {
        patchFields.maiden_name = u.maidenName?.trim() || null;
      }
      if (typeof u.birthYear === "number" && u.birthYear >= 1700) {
        patchFields.birth_year = u.birthYear;
      }
      if ("passingYear" in u) {
        patchFields.passing_year = u.passingYear ?? null;
      }
      if ("birthPlace" in u) {
        patchFields.birth_place = u.birthPlace?.trim() || null;
      }
      if ("occupation" in u) {
        patchFields.occupation = u.occupation?.trim() || null;
      }
      if (typeof u.bio === "string") {
        patchFields.bio = u.bio;
      }
      if (u.beliefs) {
        patchFields.beliefs = u.beliefs;
      }
      if (u.health) {
        patchFields.health = u.health;
      }
      if ("spiritAnimal" in u) {
        patchFields.spirit_animal = u.spiritAnimal ?? null;
      }
      if (typeof u.isPublicToFamily === "boolean") {
        patchFields.is_public_to_family = u.isPublicToFamily;
      }
      if (typeof u.portraitUrl === "string" && u.portraitUrl.trim()) {
        patchFields.portrait_url = await maybeUploadMediaToPrivateBucket(
          supabase,
          u.portraitUrl,
          `portraits/${targetId}`
        );
      }
    }

    if (Object.keys(patchFields).length === 0) {
      return NextResponse.json(
        { error: "No supported update fields provided." },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("family_members")
      .update(patchFields)
      .eq("id", targetId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const fresh = await fetchAllFamilyMembers(supabase);
    if (fresh.error) {
      return NextResponse.json({ error: fresh.error }, { status: 500 });
    }

    const projected = await projectMembersForViewer(
      supabase,
      fresh.members,
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
      err instanceof Error ? err.message : "Failed to update member in Supabase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
  const memberId = request.nextUrl.searchParams.get("memberId");

  // 1. Delete a single owned profile (owner or Admin Curator)
  if (memberId) {
    const { data: existingRow } = await supabase
      .from("family_members")
      .select("id, owner_email")
      .eq("id", memberId)
      .single();

    if (!existingRow) {
      return NextResponse.json(
        { error: "Family member not found." },
        { status: 404 }
      );
    }

    const isOwner =
      Boolean(existingRow.owner_email) &&
      String(existingRow.owner_email).toLowerCase() === session.email;

    if (!isCurator && !isOwner) {
      return NextResponse.json(
        { error: "Only the profile creator or Admin Curator can delete this profile." },
        { status: 403 }
      );
    }

    const { error: delErr } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Clean up dangling relationship references in remaining members
    const { members: remaining } = await fetchAllFamilyMembers(supabase);
    for (const m of remaining) {
      const nextParents = m.parentIds.filter((id) => id !== memberId);
      const nextPartners = m.partnerIds.filter((id) => id !== memberId);
      const nextChildren = m.childrenIds.filter((id) => id !== memberId);
      if (
        nextParents.length !== m.parentIds.length ||
        nextPartners.length !== m.partnerIds.length ||
        nextChildren.length !== m.childrenIds.length
      ) {
        await supabase
          .from("family_members")
          .update({
            parent_ids: nextParents,
            partner_ids: nextPartners,
            children_ids: nextChildren,
          })
          .eq("id", m.id);
      }
    }

    const fresh = await fetchAllFamilyMembers(supabase);
    const projected = await projectMembersForViewer(
      supabase,
      fresh.members,
      session.email,
      isCurator
    );
    return NextResponse.json({
      ok: true,
      members: projected,
      source: "supabase",
    });
  }

  // 2. Clear entire tree (Admin Curator only — never auto-reseeds)
  if (!isCurator) {
    return NextResponse.json(
      { error: "Admin Curator Code required to clear the entire tree." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("family_members")
    .delete()
    .neq("id", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    members: [],
    source: "supabase",
  });
}
