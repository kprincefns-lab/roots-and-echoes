import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface AuthenticatedFamilyUser {
  email: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Safe to ignore when invoked from a Server Component render
        }
      },
    },
  });
}

export async function getAuthenticatedSession(): Promise<AuthenticatedFamilyUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    null;
  const rawAvatar =
    (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) ||
    (typeof meta.picture === "string" && meta.picture.trim()) ||
    null;

  return {
    email: user.email.trim().toLowerCase(),
    userId: user.id,
    fullName: rawName,
    avatarUrl: rawAvatar,
  };
}
