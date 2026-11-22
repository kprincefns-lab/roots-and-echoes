import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { verifyInviteCodeHeader } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const inviteCode = request.headers.get("x-family-code");
    if (!verifyInviteCodeHeader(inviteCode)) {
      return NextResponse.json(
        { error: "Invalid Family Invite Code. Please check the code from your family curator." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured on this server." },
        { status: 503 }
      );
    }

    const origin = request.nextUrl.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Verification code & magic link sent to your email.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send verification code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
