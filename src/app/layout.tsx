import type { Metadata } from 'next';
import { Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { AppShell } from '@/components/app-shell';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const sourceCode = Source_Code_Pro({
  variable: '--font-source-code',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Canada Pulse',
  description:
    'Canada AI intelligence platform with live signals, briefings, watchlists, and source-quality analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${sourceCode.variable} antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
