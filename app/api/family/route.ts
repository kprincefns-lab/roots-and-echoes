import { NextRequest, NextResponse } from "next/server";
import { SEED_FAMILY } from "@/data/seedFamily";
import { FamilyMember, MemoryPhoto, SpiritAnimalType } from "@/types/family";
import {
  extractFamilyCode,
  familyMemberToRow,
  fetchAllFamilyMembers,
  getSupabaseAdmin,
  maybeUploadMediaToBucket,
  verifyAccessCode,
} from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const inviteRequired = Boolean(
    process.env.FAMILY_INVITE_CODE || process.env.ADMIN_CURATOR_CODE
  );

  if (!supabase) {
    return NextResponse.json(
      {
        members: SEED_FAMILY,
        source: "local",
        inviteRequired: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const { members, error } = await fetchAllFamilyMembers(supabase);
  if (error) {
    return NextResponse.json(
      { error: `Failed to load family archive from Supabase: ${error}` },
      { status: 500 }
    );
  }

  // Return exact live rows (including [] if the curator cleared the tree — never auto-reseed)
  return NextResponse.json(
    {
      members,
      source: "supabase",
      inviteRequired,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on this server." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      action?: "seed-demo";
      members?: FamilyMember[];
      replaceAll?: boolean;
    };

    const isAdminAction = body.action === "seed-demo" || Boolean(body.replaceAll);
    const auth = verifyAccessCode(
      extractFamilyCode(request.headers),
      isAdminAction
    );
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Explicit Curator action: "Load Demo Seed Data"
    if (body.action === "seed-demo") {
      const { error: delErr } = await supabase
        .from("family_members")
        .delete()
        .neq("id", "");
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      const { error: seedErr } = await supabase
        .from("family_members")
        .upsert(SEED_FAMILY.map(familyMemberToRow), { onConflict: "id" });
      if (seedErr) {
        return NextResponse.json({ error: seedErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      if (fresh.error) {
        return NextResponse.json({ error: fresh.error }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        members: fresh.members,
        source: "supabase",
      });
    }

    const incoming = body.members;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { error: "Missing family members payload." },
        { status: 400 }
      );
    }

    // Upload any raster base64 portraits & memory photos to the family-media bucket
    const prepared: FamilyMember[] = await Promise.all(
      incoming.map(async (member) => {
        const portraitUrl = await maybeUploadMediaToBucket(
          supabase,
          member.portraitUrl,
          `portraits/${member.id}`
        );
        const gallery: MemoryPhoto[] = await Promise.all(
          (member.gallery ?? []).map(async (photo) => ({
            ...photo,
            url: await maybeUploadMediaToBucket(
              supabase,
              photo.url,
              `memories/${member.id}`
            ),
          }))
        );
        return { ...member, portraitUrl, gallery };
      })
    );

    if (body.replaceAll) {
      const { error: delErr } = await supabase
        .from("family_members")
        .delete()
        .neq("id", "");
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    }

    const { error: upsertErr } = await supabase
      .from("family_members")
      .upsert(prepared.map(familyMemberToRow), { onConflict: "id" });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const fresh = await fetchAllFamilyMembers(supabase);
    if (fresh.error) {
      return NextResponse.json({ error: fresh.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      members: fresh.members,
      source: "supabase",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save to Supabase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on this server." },
      { status: 503 }
    );
  }

  try {
    const auth = verifyAccessCode(extractFamilyCode(request.headers), false);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = (await request.json()) as {
      memberId?: string;
      spiritAnimal?: SpiritAnimalType | null;
      addMemoryPhoto?: MemoryPhoto;
      member?: FamilyMember;
    };

    if (body.member) {
      const portraitUrl = await maybeUploadMediaToBucket(
        supabase,
        body.member.portraitUrl,
        `portraits/${body.member.id}`
      );
      const gallery: MemoryPhoto[] = await Promise.all(
        (body.member.gallery ?? []).map(async (photo) => ({
          ...photo,
          url: await maybeUploadMediaToBucket(
            supabase,
            photo.url,
            `memories/${body.member!.id}`
          ),
        }))
      );
      const { error: updateErr } = await supabase
        .from("family_members")
        .upsert(familyMemberToRow({ ...body.member, portraitUrl, gallery }), {
          onConflict: "id",
        });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      if (fresh.error) {
        return NextResponse.json({ error: fresh.error }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        members: fresh.members,
        source: "supabase",
      });
    }

    if (!body.memberId) {
      return NextResponse.json(
        { error: "Missing memberId." },
        { status: 400 }
      );
    }

    if (body.addMemoryPhoto) {
      const { data: existing, error: fetchErr } = await supabase
        .from("family_members")
        .select("gallery")
        .eq("id", body.memberId)
        .single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      const uploadedUrl = await maybeUploadMediaToBucket(
        supabase,
        body.addMemoryPhoto.url,
        `memories/${body.memberId}`
      );
      const savedPhoto: MemoryPhoto = {
        ...body.addMemoryPhoto,
        url: uploadedUrl,
      };
      const currentGallery = Array.isArray(existing?.gallery)
        ? (existing.gallery as MemoryPhoto[])
        : [];

      const { error: updateErr } = await supabase
        .from("family_members")
        .update({ gallery: [savedPhoto, ...currentGallery] })
        .eq("id", body.memberId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      if (fresh.error) {
        return NextResponse.json({ error: fresh.error }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        photo: savedPhoto,
        members: fresh.members,
        source: "supabase",
      });
    }

    if ("spiritAnimal" in body) {
      const { error: updateErr } = await supabase
        .from("family_members")
        .update({ spirit_animal: body.spiritAnimal ?? null })
        .eq("id", body.memberId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const fresh = await fetchAllFamilyMembers(supabase);
      if (fresh.error) {
        return NextResponse.json({ error: fresh.error }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        members: fresh.members,
        source: "supabase",
      });
    }

    return NextResponse.json(
      { error: "No supported update fields provided." },
      { status: 400 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update member in Supabase.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on this server." },
      { status: 503 }
    );
  }

  const auth = verifyAccessCode(extractFamilyCode(request.headers), true);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Clear all rows from Supabase without auto-reseeding
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
