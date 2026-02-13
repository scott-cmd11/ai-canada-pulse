import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function MethodsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "methods" });
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-textSecondary">{t("body")}</p>
      <ul className="list-disc space-y-1 pl-6 text-sm text-textSecondary">
        <li>Metadata-only storage: title, canonical URL, publisher, timestamps, tags.</li>
        <li>Real-time updates via FastAPI SSE endpoint backed by Redis Pub/Sub.</li>
        <li>Bilingual routing and UI chrome with `next-intl`.</li>
      </ul>
      <Link href={`/${params.locale}/canada`} className="inline-block rounded border border-borderSoft px-4 py-2">
        Back to dashboard
      </Link>
    </main>
  );
}
