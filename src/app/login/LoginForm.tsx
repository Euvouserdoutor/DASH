"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/auth/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("Credenciais inválidas.");
        return;
      }

      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/overview");
      router.refresh();
    } catch {
      setError("Credenciais inválidas.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-white/[0.04] px-3 py-3 text-[var(--text-primary)] outline-none transition focus:border-[color:var(--purple-neon)]"
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Senha</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-white/[0.04] px-3 py-3 text-[var(--text-primary)] outline-none transition focus:border-[color:var(--purple-neon)]"
        />
      </label>

      {error ? <p className="text-sm text-[var(--loss-red)]">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
