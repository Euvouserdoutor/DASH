import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth/server";

import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/overview");

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg-primary)] px-4 py-10 text-[var(--text-primary)]">
      <section className="w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">DASH Crypto Pulse</p>
            <h1 className="mt-2 text-2xl font-semibold">Acesso seguro</h1>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-white text-sm font-bold text-black">D</span>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          Entre com uma conta criada no provedor de autenticação configurado para este projeto.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
