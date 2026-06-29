import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="dashboard-shell">
      <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[238px_1fr]">
        <div className="border-r border-[var(--card-border)] md:sticky md:top-0 md:h-dvh">
          <Sidebar />
        </div>

        <main className="min-w-0">
          <Topbar title={title} />
          <section className="space-y-[14px] p-[14px]">{children}</section>
        </main>
      </div>
    </div>
  );
}
