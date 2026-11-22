import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/supabaseServer";
import { extractCuratorCode, isCuratorCodeValid } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedSession();
  const isCurator = isCuratorCodeValid(extractCuratorCode(request.headers));

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        email: null,
        fullName: null,
        avatarUrl: null,
        isCurator: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      email: session.email,
      fullName: session.fullName,
      avatarUrl: session.avatarUrl,
      isCurator,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
