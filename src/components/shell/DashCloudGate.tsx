"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  activateCloudSync,
  deactivateCloudSync,
  flushCloudWrites,
  listenCloudQueue,
  loadCloudState,
  queueCloudWrite,
} from "@/lib/client/dash-cloud-sync";
import { createSupabaseBrowserClient } from "@/lib/auth/browser";
import { loadPortfolioFromCloud, getPortfolioCloudPayload } from "@/store/portfolioStore";
import { loadAlertsFromCloud, getAlertsCloudPayload } from "@/store/alertsStore";
import { loadWatchlistFromCloud, getWatchlistCloudPayload } from "@/store/watchlistStore";
import { loadSettingsFromCloud, getSettingsCloudPayload } from "@/store/settingsStore";

const LEGACY_KEYS = {
  portfolio: "dash.manual.portfolio.v1",
  alerts: "dash.alerts.v1",
  watchlist: "dash.watchlist.v1",
  settings: "dash.settings.v1",
} as const;

function hydrate(sections: Partial<Record<keyof typeof LEGACY_KEYS, unknown>>) {
  loadPortfolioFromCloud(sections.portfolio);
  loadAlertsFromCloud(sections.alerts);
  loadWatchlistFromCloud(sections.watchlist);
  loadSettingsFromCloud(sections.settings);
}

export function DashCloudGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicRoute = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth/");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [authEpoch, setAuthEpoch] = useState(0);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [hasLegacy, setHasLegacy] = useState(false);
  const [saving, setSaving] = useState({ pending: 0, failed: false, message: "" });

  useEffect(() => listenCloudQueue(setSaving), []);
  useEffect(() => {
    try {
      const { data: { subscription } } = createSupabaseBrowserClient().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setAuthEpoch((number) => number + 1);
        }
      });
      return () => subscription.unsubscribe();
    } catch {
      // Show the standard login or configuration error instead of crashing.
    }
  }, []);

  useEffect(() => {
    if (publicRoute) {
      deactivateCloudSync();
      hydrate({});
      setReady(false);
      setUserId("");
      return;
    }
    let cancelled = false;
    setReady(false);
    setError("");
    (async () => {
      // Complete pending saves before loading the next route's snapshot.
      await flushCloudWrites();
      if (cancelled) return;
      deactivateCloudSync();
      const data = await loadCloudState();
      if (cancelled) return;
      hydrate(data.sections);
      activateCloudSync(data.userId);
      setUserId(data.userId);
      const cloudHasData = Object.values(data.sections).some((section) =>
        Array.isArray(section) ? section.length > 0 : Boolean(section && Object.keys(section as object).length > 0)
      );
      const legacyAvailable = Object.values(LEGACY_KEYS).some((key) => {
        try { return Boolean(window.localStorage.getItem(key)); } catch { return false; }
      });
      setHasLegacy(!cloudHasData && legacyAvailable);
      setReady(true);
    })().catch((cause: unknown) => {
      if (cancelled) return;
      deactivateCloudSync();
      setError(cause instanceof Error ? cause.message : "Falha ao carregar dados do usuário.");
    });
    return () => { cancelled = true; };
  }, [pathname, publicRoute, retry, authEpoch]);

  function retrySave() {
    if (!userId) return;
    activateCloudSync(userId);
    queueCloudWrite("portfolio", getPortfolioCloudPayload());
    queueCloudWrite("alerts", getAlertsCloudPayload());
    queueCloudWrite("watchlist", getWatchlistCloudPayload());
    queueCloudWrite("settings", getSettingsCloudPayload());
  }

  function importLegacy() {
    if (!userId || !window.confirm("Importar dados antigos armazenados neste navegador para sua conta atual? Verifique se pertencem a você. Nenhum arquivo local será apagado.")) return;
    const sections: Partial<Record<keyof typeof LEGACY_KEYS, unknown>> = {};
    for (const [section, key] of Object.entries(LEGACY_KEYS) as Array<[keyof typeof LEGACY_KEYS, string]>) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) sections[section] = JSON.parse(raw);
      } catch {
        // Skip corrupted old values; never overwrite cloud data automatically.
      }
    }
    hydrate(sections);
    retrySave();
    setHasLegacy(false);
  }

  if (publicRoute) return <>{children}</>;
  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
        <div className="max-w-lg space-y-3 rounded-xl border border-[var(--card-border)] p-6 text-center">
          <h1 className="text-lg font-semibold">DASH — carteira privada</h1>
          {error ? (
            <>
              <p className="text-sm text-[var(--loss-red)]">{error}</p>
              <p className="text-xs text-[var(--text-muted)]">Nenhum dado antigo foi apagado ou substituído.</p>
              <button type="button" onClick={() => setRetry((number) => number + 1)}
                className="rounded-lg bg-white px-4 py-2 text-sm text-black">Tentar novamente</button>
            </>
          ) : <p className="text-sm text-[var(--text-muted)]">Carregando dados da conta autenticada...</p>}
        </div>
      </main>
    );
  }
  return (
    <>
      {(hasLegacy || saving.failed || saving.pending > 0) && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-2 text-xs">
          <span>
            {saving.failed ? "Erro ao salvar no Supabase: " + saving.message
              : hasLegacy ? "Há dados antigos neste navegador. A importação é opcional e exige sua confirmação."
                : "Salvando alterações na nuvem..."}
          </span>
          <div className="flex gap-2">
            {hasLegacy && <button type="button" onClick={importLegacy} className="underline">Importar dados locais</button>}
            {saving.failed && <button type="button" onClick={retrySave} className="underline">Tentar salvar novamente</button>}
          </div>
        </div>
      )}
      {children}
    </>
  );
}
