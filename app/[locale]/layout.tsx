import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ModeProvider } from "../../components/mode-provider";
import { ThemeProvider } from "../../components/theme-provider";
import { routing } from "../../i18n/routing";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <ModeProvider>{children}</ModeProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
