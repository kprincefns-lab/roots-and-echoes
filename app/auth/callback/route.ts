import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchAllFamilyMembers, getSupabaseAdmin } from "@/lib/supabaseAdmin";

const INVITE_COOKIE_NAME = "family_invite_verified";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(`${origin}/?authError=oauth_failed`);
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?authError=oauth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?authError=oauth_failed`);
  }

  const hasInviteCookie =
    request.cookies.get(INVITE_COOKIE_NAME)?.value === "1";

  let isRecognizedFamilyMember = false;
  if (!hasInviteCookie) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { members } = await fetchAllFamilyMembers(admin);
      isRecognizedFamilyMember = members.some(
        (m) =>
          m.ownerEmail?.toLowerCase() === email ||
          (m.approvedViewerEmails ?? []).some(
            (e) => e.toLowerCase() === email
          )
      );
    }
  }

  // Enforce the invite gate: reject strangers who bypassed /api/auth/verify-invite
  if (!hasInviteCookie && !isRecognizedFamilyMember) {
    await supabase.auth.signOut();
    const denied = NextResponse.redirect(`${origin}/?authError=invite_required`);
    denied.cookies.delete(INVITE_COOKIE_NAME);
    return denied;
  }

  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete(INVITE_COOKIE_NAME);
  return response;
}
