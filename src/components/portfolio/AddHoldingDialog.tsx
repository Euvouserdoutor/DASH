"use client";

import { useState } from "react";

import { ManualHoldingForm } from "@/components/portfolio/ManualHoldingForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePortfolioStore } from "@/store/portfolioStore";

type AddHoldingDialogProps = {
  label?: string;
  triggerClassName?: string;
};

export function AddHoldingDialog({
  label = "Adicionar ativo",
  triggerClassName = "rounded-xl bg-[color:var(--purple-neon)] px-3 py-2 text-sm font-medium text-white",
}: AddHoldingDialogProps) {
  const [open, setOpen] = useState(false);
  const { addHolding } = usePortfolioStore();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <GlassCard className="w-full max-w-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold">Adicionar posição manual</h4>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-muted)]">Fechar</button>
            </div>
            <ManualHoldingForm
              onSubmit={(input) => {
                addHolding(input);
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            />
          </GlassCard>
        </div>
      ) : null}
    </>
  );
}
