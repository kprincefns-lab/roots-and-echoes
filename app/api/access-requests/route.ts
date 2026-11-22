import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/supabaseServer";
import {
  AccessRequestRow,
  extractCuratorCode,
  fetchAllFamilyMembers,
  getSupabaseAdmin,
  isCuratorCodeValid,
  rowToAccessRequest,
} from "@/lib/supabaseAdmin";
import { AccessRequestType } from "@/types/family";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
  const { members, error: memErr } = await fetchAllFamilyMembers(supabase);
  if (memErr) {
    return NextResponse.json({ error: memErr }, { status: 500 });
  }

  const memberNameMap = new Map(
    members.map((m) => [m.id, `${m.firstName} ${m.lastName}`])
  );
  const ownedIds = new Set(
    members
      .filter((m) => m.ownerEmail?.toLowerCase() === session.email)
      .map((m) => m.id)
  );

  const { data: reqRows, error: reqErr } = await supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  const all = ((reqRows ?? []) as AccessRequestRow[]).map((r) =>
    rowToAccessRequest(r, memberNameMap)
  );

  const incoming = isCurator
    ? all
    : all.filter((r) => ownedIds.has(r.memberId));

  const outgoing = all.filter((r) => r.requesterEmail === session.email);
  const pendingCount = incoming.filter((r) => r.status === "pending").length;

  return NextResponse.json(
    {
      incoming,
      outgoing,
      pendingCount,
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

  try {
    const body = (await request.json()) as {
      memberId?: string;
      requesterName?: string;
      note?: string;
      requestType?: AccessRequestType;
    };

    if (!body.memberId) {
      return NextResponse.json(
        { error: "Missing memberId." },
        { status: 400 }
      );
    }

    const requestType: AccessRequestType =
      body.requestType === "claim" ? "claim" : "view";

    const { data: targetMember, error: memErr } = await supabase
      .from("family_members")
      .select("id, owner_email")
      .eq("id", body.memberId)
      .single();

    if (memErr || !targetMember) {
      return NextResponse.json(
        { error: "Family member not found." },
        { status: 404 }
      );
    }

    if (
      requestType === "claim" &&
      targetMember.owner_email &&
      String(targetMember.owner_email).toLowerCase() === session.email
    ) {
      return NextResponse.json(
        { error: "You already own this profile." },
        { status: 400 }
      );
    }

    const { error: upsertErr } = await supabase
      .from("access_requests")
      .upsert(
        {
          member_id: body.memberId,
          requester_email: session.email,
          requester_name: body.requesterName?.trim() || null,
          note: body.note?.trim() || null,
          request_type: requestType,
          status: "pending",
        },
        { onConflict: "member_id,requester_email" }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "pending", requestType });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit access request.";
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
      requestId?: string;
      decision?: "approved" | "declined";
    };

    if (
      !body.requestId ||
      (body.decision !== "approved" && body.decision !== "declined")
    ) {
      return NextResponse.json(
        { error: "Valid requestId and decision ('approved' or 'declined') are required." },
        { status: 400 }
      );
    }

    const { data: reqRow, error: reqErr } = await supabase
      .from("access_requests")
      .select("*")
      .eq("id", body.requestId)
      .single();

    if (reqErr || !reqRow) {
      return NextResponse.json(
        { error: "Access request not found." },
        { status: 404 }
      );
    }

    const typedReq = reqRow as AccessRequestRow;

    const { data: memberRow, error: memErr } = await supabase
      .from("family_members")
      .select("id, owner_email, approved_viewer_emails")
      .eq("id", typedReq.member_id)
      .single();

    if (memErr || !memberRow) {
      return NextResponse.json(
        { error: "Target family member not found." },
        { status: 404 }
      );
    }

    const isOwner =
      Boolean(memberRow.owner_email) &&
      String(memberRow.owner_email).toLowerCase() === session.email;

    if (typedReq.request_type === "claim") {
      if (!isCurator) {
        return NextResponse.json(
          { error: "Admin Curator Code required to approve or decline ownership claims." },
          { status: 403 }
        );
      }
    } else if (!isCurator && !isOwner) {
      return NextResponse.json(
        { error: "Only the profile owner or Admin Curator can respond to this request." },
        { status: 403 }
      );
    }

    // Apply approval effect on public.family_members
    if (body.decision === "approved") {
      if (typedReq.request_type === "claim") {
        const { error: claimErr } = await supabase
          .from("family_members")
          .update({ owner_email: typedReq.requester_email.toLowerCase() })
          .eq("id", typedReq.member_id);
        if (claimErr) {
          return NextResponse.json({ error: claimErr.message }, { status: 500 });
        }
      } else {
        const existingApproved = Array.isArray(memberRow.approved_viewer_emails)
          ? (memberRow.approved_viewer_emails as string[]).map((e) =>
              e.toLowerCase()
            )
          : [];
        const updatedApproved = Array.from(
          new Set([...existingApproved, typedReq.requester_email.toLowerCase()])
        );
        const { error: appErr } = await supabase
          .from("family_members")
          .update({ approved_viewer_emails: updatedApproved })
          .eq("id", typedReq.member_id);
        if (appErr) {
          return NextResponse.json({ error: appErr.message }, { status: 500 });
        }
      }
    }

    const { error: statusErr } = await supabase
      .from("access_requests")
      .update({ status: body.decision })
      .eq("id", body.requestId);

    if (statusErr) {
      return NextResponse.json({ error: statusErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: body.decision });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process access request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
