import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function MethodsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "methods" });
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <section className="rounded-lg border border-borderSoft bg-surface p-6">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-textSecondary">{t("body")}</p>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-borderSoft bg-surface p-5">
          <h2 className="text-lg font-semibold">{t("architecture.title")}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-textSecondary">
            <li>{t("architecture.a")}</li>
            <li>{t("architecture.b")}</li>
            <li>{t("architecture.c")}</li>
          </ul>
        </article>
        <article className="rounded-lg border border-borderSoft bg-surface p-5">
          <h2 className="text-lg font-semibold">{t("governance.title")}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-textSecondary">
            <li>{t("governance.a")}</li>
            <li>{t("governance.b")}</li>
            <li>{t("governance.c")}</li>
          </ul>
        </article>
      </section>
      <section className="rounded-lg border border-borderSoft bg-surface p-5">
        <h2 className="text-lg font-semibold">{t("ops.title")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-textSecondary md:grid-cols-3">
          <div className="rounded border border-borderSoft bg-bg p-3">{t("ops.a")}</div>
          <div className="rounded border border-borderSoft bg-bg p-3">{t("ops.b")}</div>
          <div className="rounded border border-borderSoft bg-bg p-3">{t("ops.c")}</div>
        </div>
      </section>
      <Link href={`/${params.locale}/canada`} className="inline-block rounded border border-borderSoft px-4 py-2">
        {t("back")}
      </Link>
    </main>
  );
}
