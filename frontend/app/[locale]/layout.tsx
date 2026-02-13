import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import { ModeProvider } from "../../components/mode-provider";
import { ThemeProvider } from "../../components/theme-provider";
import { routing } from "../../i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(params.locale as "en" | "fr")) {
    notFound();
  }

  const messages = await getMessages({ locale: params.locale });
  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <ThemeProvider>
        <ModeProvider>{children}</ModeProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
