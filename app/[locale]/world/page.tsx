import { GlobalDashboardPage } from "../../../components/global-dashboard-page";

export default async function WorldPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams;
  const tw = typeof p.tw === "string" ? p.tw : "7d";
  return <GlobalDashboardPage initialTimeWindow={tw} />;
}
