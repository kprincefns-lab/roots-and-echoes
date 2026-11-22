import { NextRequest, NextResponse } from "next/server";
import { verifyInviteCodeHeader } from "@/lib/supabaseAdmin";

export const INVITE_COOKIE_NAME = "family_invite_verified";

export async function POST(request: NextRequest) {
  try {
    let code = request.headers.get("x-family-code");
    if (!code) {
      const body = (await request.json().catch(() => ({}))) as {
        code?: string;
      };
      code = body.code ?? null;
    }

    if (!verifyInviteCodeHeader(code)) {
      return NextResponse.json(
        {
          error:
            "Invalid Family Invite Code. Please check the code from your family curator.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(INVITE_COOKIE_NAME, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10, // 10 minutes to complete Google OAuth redirect
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to verify Family Invite Code." },
      { status: 500 }
    );
  }
}
