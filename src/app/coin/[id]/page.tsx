import { CoinDetailWorkspace } from "@/components/coin/CoinDetailWorkspace";
import { AppShell } from "@/components/shell/AppShell";

type Props = { params: Promise<{ id: string }> };
export default async function CoinPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell title={"Ativo: " + id.toUpperCase()}>
      <CoinDetailWorkspace symbol={id} />
    </AppShell>
  );
}
