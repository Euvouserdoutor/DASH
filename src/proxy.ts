import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Public pages and strictly allowlisted market-data GETs; private APIs use Supabase Auth.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Only read-only market information is public. All other APIs retain Supabase Auth.
  const publicMarketRequest =
    request.method === "GET" &&
    (path === "/api/market" || /^\/api\/chart\/(bitcoin|ethereum|solana)$/.test(path));

  if (publicMarketRequest || !path.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
