import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; token?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const token = body.token?.trim() ?? "";

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
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

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Invalid or expired verification code." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      email: data.user.email?.toLowerCase() ?? email,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
