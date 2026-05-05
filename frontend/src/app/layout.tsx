import type { Metadata, Viewport } from "next"
import { Archivo, Archivo_Black, Fraunces, JetBrains_Mono } from "next/font/google"
import { SOURCES } from "@/lib/source-registry"
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
    default: "AI Canada Pulse - Canadian AI Adoption Monitor",
    template: "%s - AI Canada Pulse",
  },
  description: `Source-linked monitor tracking AI adoption in Canada from ${SOURCES.length} public sources, including official Statistics Canada tables, the Government of Canada AI Register, procurement demand, policy, research, jobs, and proxy signals.`,
  keywords: ["Canada AI adoption", "Statistics Canada AI", "Government of Canada AI Register", "AI procurement Canada", "Canadian AI policy", "AI research", "AI jobs Canada", "machine learning", "AI dashboard"],
  authors: [{ name: "Scott Hazlitt" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "AI Canada Pulse",
    title: "AI Canada Pulse - Canadian AI Adoption Monitor",
    description: `Source-linked Canadian AI adoption monitor with ${SOURCES.length} public sources, official adoption metrics, public-sector system evidence, and clearly labelled proxy signals.`,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Canada Pulse",
    description: `Canadian AI adoption intelligence from ${SOURCES.length} source-linked public datasets and feeds.`,
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
