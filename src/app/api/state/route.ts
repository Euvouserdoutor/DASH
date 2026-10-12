import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const sections = ["portfolio", "alerts", "watchlist", "settings"] as const;
type Section = (typeof sections)[number];
const NO_STORE = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}
async function authorized() {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const { data, error } = await db.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) return null;
  return { db, userId: data.user.id };
}
export async function GET() {
  const auth = await authorized();
  if (!auth) return json({ error: "unauthorized" }, 401);
  const { data, error } = await auth.db
    .from("dash_state_sections")
    .select("section,payload")
    .eq("user_id", auth.userId);
  if (error) return json({ error: "state_storage_unavailable" }, 503);
  const result: Partial<Record<Section, unknown>> = {};
  for (const row of data ?? []) {
    if (sections.includes(row.section as Section)) result[row.section as Section] = row.payload;
  }
  return json({ userId: auth.userId, sections: result });
}
export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "invalid_origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "invalid_content_type" }, 415);
  const auth = await authorized();
  if (!auth) return json({ error: "unauthorized" }, 401);
  let value: unknown;
  try { value = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return json({ error: "invalid_payload" }, 400);
  const { section, payload } = value as Record<string, unknown>;
  if (typeof section !== "string" || !sections.includes(section as Section)) return json({ error: "invalid_section" }, 400);
  const correctShape = section === "settings"
    ? Boolean(payload && typeof payload === "object" && !Array.isArray(payload))
    : Array.isArray(payload);
  if (!correctShape) return json({ error: "invalid_payload" }, 400);
  const serialized = JSON.stringify(payload);
  if (!serialized || Buffer.byteLength(serialized, "utf8") > 200_000) return json({ error: "payload_too_large" }, 413);
  const { error } = await auth.db.from("dash_state_sections").upsert({
    user_id: auth.userId,
    section,
    payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,section" });
  if (error) return json({ error: "state_write_failed" }, 503);
  return json({ saved: true });
}
