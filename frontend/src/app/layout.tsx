import type { Metadata, Viewport } from "next"
import { Archivo, Archivo_Black, Fraunces, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
})

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-display",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
  variable: "--font-italic",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

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
    <html lang="en" className={`${archivo.variable} ${archivoBlack.variable} ${jetbrains.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={archivo.className} style={{ fontFeatureSettings: '"tnum"' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}