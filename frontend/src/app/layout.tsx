import type { Metadata } from "next"
import { Fraunces, Manrope } from "next/font/google"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: {
    default: "AI Canada Pulse — Canadian AI Intelligence Monitor",
    template: "%s — AI Canada Pulse",
  },
  description: "Fact-driven intelligence platform tracking AI developments across Canada. Real-time signals from 17+ public data sources covering policy, research, industry, and market activity.",
  keywords: ["Canada AI", "artificial intelligence", "Canadian AI policy", "AI research", "AI jobs Canada", "machine learning", "AI dashboard"],
  authors: [{ name: "Scott Hazlitt" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "AI Canada Pulse",
    title: "AI Canada Pulse — Canadian AI Intelligence Monitor",
    description: "Fact-driven intelligence platform tracking AI developments across Canada. 17+ public data sources, zero fabricated data.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Canada Pulse",
    description: "Real-time Canadian AI intelligence from 17+ public data sources.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={manrope.className} style={{ fontFeatureSettings: '"tnum"' }}>
        {children}
      </body>
    </html>
  )
}