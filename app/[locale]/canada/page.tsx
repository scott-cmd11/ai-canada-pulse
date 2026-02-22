import { DashboardPage } from "../../../components/dashboard-page";

export default async function CanadaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams;
  const tw = typeof p.tw === "string" ? p.tw : "7d";
  const m = typeof p.m === "string" ? p.m : undefined;
  return <DashboardPage scope="canada" initialTimeWindow={tw} initialMode={m} />;
}
