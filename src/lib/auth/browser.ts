"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) throw new Error("auth_not_configured");

  return createBrowserClient(env.url, env.publishableKey);
}
