import type { Metadata } from 'next';
import { Space_Grotesk, Source_Code_Pro } from 'next/font/google';
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
    'Live and interactive intelligence dashboard for AI activity in Canada, with daily, weekly, monthly, yearly, and since-ChatGPT timelines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${sourceCode.variable} antialiased`}>{children}</body>
    </html>
  );
}
