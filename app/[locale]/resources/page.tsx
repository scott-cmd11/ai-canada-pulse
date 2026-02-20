import { getTranslations } from "next-intl/server";
import { ResourcesPage } from "../../../components/resources-page";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // A server component can read cookies/headers to determine theme,
    // but here we can just pass down default placeholders 
    // and let the client providers handle the actual theme toggle.
    const otherLocale = locale === "en" ? "fr" : "en";

    return (
        <ResourcesPage
            locale={locale}
            otherLocale={otherLocale}
        />
    );
}
