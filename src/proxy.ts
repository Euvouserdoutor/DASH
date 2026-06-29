import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPages = [
  "/overview",
  "/dashboard",
  "/transactions",
  "/budgets",
  "/accounts",
  "/analytics",
  "/investments",
  "/settings",
  "/portfolio",
  "/watchlist",
  "/alerts",
  "/market",
  "/coin",
];

function isProtectedPage(pathname: string) {
  return protectedPages.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });

  const needsSession = isProtectedPage(request.nextUrl.pathname) || isProtectedApi(request.nextUrl.pathname);

  if (!url || !publishableKey) {
    if (isProtectedApi(request.nextUrl.pathname)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (needsSession) return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }

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

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  if (!user && isProtectedApi(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user && isProtectedPage(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
