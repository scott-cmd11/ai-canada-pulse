import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Canada's Pulse",
  description: "What's happening in Canada today — in plain language",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
