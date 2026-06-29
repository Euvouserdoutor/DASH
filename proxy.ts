import type { NextRequest } from "next/server";

import { proxy as authProxy } from "./src/proxy";

export function proxy(request: NextRequest) {
  return authProxy(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
