import { CoinDetailWorkspace } from "@/components/coin/CoinDetailWorkspace";
import { AppShell } from "@/components/shell/AppShell";

type CoinPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CoinPage({ params }: CoinPageProps) {
  const { symbol } = await params;

  return (
    <AppShell title={`${symbol.toUpperCase()} Details`}>
      <CoinDetailWorkspace symbol={symbol} />
    </AppShell>
  );
}
