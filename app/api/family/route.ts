import { NextRequest, NextResponse } from "next/server";
import { SEED_FAMILY } from "@/data/seedFamily";
import { FamilyMember, MemoryPhoto, SpiritAnimalType } from "@/types/family";
import {
  familyMemberToRow,
  FamilyMemberRow,
  getSupabaseAdmin,
  maybeUploadMediaToBucket,
  rowToFamilyMember,
  verifyAccessCode,
} from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const inviteRequired = Boolean(
    process.env.FAMILY_INVITE_CODE || process.env.ADMIN_CURATOR_CODE
  );

  if (!supabase) {
    return NextResponse.json({
      members: SEED_FAMILY,
      source: "local",
      inviteRequired: false,
    });
  }

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("generation", { ascending: true })
    .order("birth_year", { ascending: true });

  if (error) {
    return NextResponse.json(
      { members: SEED_FAMILY, source: "local", inviteRequired, error: error.message },
      { status: 200 }
    );
  }

  // First-run auto-seed: populate the 14-member archive if table is empty
  if (!data || data.length === 0) {
    const seedRows = SEED_FAMILY.map(familyMemberToRow);
    const { error: seedError } = await supabase
      .from("family_members")
      .upsert(seedRows, { onConflict: "id" });

    if (seedError) {
      return NextResponse.json({
        members: SEED_FAMILY,
        source: "local",
        inviteRequired,
      });
    }

    return NextResponse.json({
      members: SEED_FAMILY,
      source: "supabase",
      inviteRequired,
    });
  }

  return NextResponse.json({
    members: (data as FamilyMemberRow[]).map(rowToFamilyMember),
    source: "supabase",
    inviteRequired,
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, source: "local" });
  }

  const body = (await request.json()) as {
    members?: FamilyMember[];
    replaceAll?: boolean;
  };

  const auth = verifyAccessCode(
    request.headers.get("x-access-code"),
    Boolean(body.replaceAll)
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
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
    await supabase.from("family_members").delete().neq("id", "");
  }

  const { error } = await supabase
    .from("family_members")
    .upsert(prepared.map(familyMemberToRow), { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, members: prepared, source: "supabase" });
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, source: "local" });
  }

  const auth = verifyAccessCode(request.headers.get("x-access-code"), false);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = (await request.json()) as {
    memberId?: string;
    spiritAnimal?: SpiritAnimalType | null;
    addMemoryPhoto?: MemoryPhoto;
  };

  if (!body.memberId) {
    return NextResponse.json({ error: "Missing memberId." }, { status: 400 });
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
    const savedPhoto: MemoryPhoto = { ...body.addMemoryPhoto, url: uploadedUrl };
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

    return NextResponse.json({ ok: true, photo: savedPhoto, source: "supabase" });
  }

  if ("spiritAnimal" in body) {
    const { error } = await supabase
      .from("family_members")
      .update({ spirit_animal: body.spiritAnimal ?? null })
      .eq("id", body.memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, source: "supabase" });
  }

  return NextResponse.json({ error: "No supported update fields provided." }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, members: SEED_FAMILY, source: "local" });
  }

  const auth = verifyAccessCode(request.headers.get("x-access-code"), true);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  await supabase.from("family_members").delete().neq("id", "");
  const { error } = await supabase
    .from("family_members")
    .upsert(SEED_FAMILY.map(familyMemberToRow), { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, members: SEED_FAMILY, source: "supabase" });
}
