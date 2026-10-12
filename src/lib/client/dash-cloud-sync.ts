"use client";

export type StateSection = "portfolio" | "alerts" | "watchlist" | "settings";
export type CloudState = {
  userId: string;
  sections: Partial<Record<StateSection, unknown>>;
};
type QueueState = { pending: number; failed: boolean; message: string };
type Listener = (value: QueueState) => void;
const listeners = new Set<Listener>();
let queueState: QueueState = { pending: 0, failed: false, message: "" };
const writes = new Map<StateSection, Promise<void>>();
let enabled = false;
let activeUserId = "";

function publish(update: Partial<QueueState>) {
  queueState = { ...queueState, ...update };
  listeners.forEach((listener) => listener(queueState));
}
export function listenCloudQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener(queueState);
  return () => { listeners.delete(listener); };
}
export function activateCloudSync(userId: string) {
  activeUserId = userId;
  enabled = true;
  publish({ failed: false, message: "" });
}
export function deactivateCloudSync() {
  enabled = false;
  activeUserId = "";
  // Pending requests still complete using their originating server session.
}
export async function loadCloudState(): Promise<CloudState> {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente." : "Banco de dados DASH indisponível.");
  const payload = await response.json() as CloudState;
  if (!payload.userId || !payload.sections || typeof payload.sections !== "object") throw new Error("Resposta de estado inválida.");
  return payload;
}

export function queueCloudWrite(section: StateSection, payload: unknown) {
  if (!enabled || !activeUserId) return;
  const userId = activeUserId;
  publish({ pending: queueState.pending + 1 });
  const previous = writes.get(section) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(async () => {
    if (!enabled || userId !== activeUserId) throw new Error("Sessão alterada.");
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ section, payload }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Não foi possível salvar " + section + " no banco.");
  });
  writes.set(section, next);
  void next.then(
    () => publish({ pending: Math.max(0, queueState.pending - 1) }),
    (error: unknown) => publish({
      pending: Math.max(0, queueState.pending - 1),
      failed: true,
      message: error instanceof Error ? error.message : "Falha ao salvar dados.",
    }),
  );
}

export async function flushCloudWrites() {
  await Promise.allSettled([...writes.values()]);
}
