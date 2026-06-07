import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ["/", "/auth"];
  const isPublic = publicPaths.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + "/") ||
      pathname.startsWith(p + "?")
  );

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable (e.g. project paused) — allow public routes, block protected ones
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // New users (no profile yet) → onboarding, except if already there
  if (user && pathname !== "/onboarding" && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
