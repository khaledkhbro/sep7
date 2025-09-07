import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/contexts/auth-context"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import dynamic from "next/dynamic"
import "./globals.css"

const MarketplaceProvider = dynamic(
  () => import("@/components/marketplace/marketplace-provider").then((mod) => ({ default: mod.MarketplaceProvider })),
  {
    loading: () => <div className="min-h-screen bg-background" />,
    ssr: true,
  },
)

export const metadata: Metadata = {
  title: "WorkHub - Microjobs & Marketplace",
  description: "Find skilled professionals for your projects or offer your services to clients worldwide",
  generator: "v0.app",
  keywords: "freelance, microjobs, marketplace, services, remote work, gig economy",
  authors: [{ name: "WorkHub Team" }],
  creator: "WorkHub",
  publisher: "WorkHub",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://workhub.com",
    title: "WorkHub - Microjobs & Marketplace",
    description: "Find skilled professionals for your projects or offer your services to clients worldwide",
    siteName: "WorkHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkHub - Microjobs & Marketplace",
    description: "Find skilled professionals for your projects or offer your services to clients worldwide",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="preload" href="/logo-design-portfolio.png" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ErrorBoundary>
          <AuthProvider>
            <MarketplaceProvider>{children}</MarketplaceProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
