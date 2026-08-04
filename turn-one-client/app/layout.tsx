import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import type React from "react"
import Script from "next/script"
import { MainFooter } from "@/components/footer/main-footer"
import { Suspense } from "react"
import './globals.css'
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { PageLoadingProvider } from "@/components/providers/page-loading-provider";
import { VersionProvider } from "@/components/providers/version-provider";
import { generateSEO, generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";


// Enhanced SEO metadata for the entire application
export const metadata: Metadata = generateSEO({
    title: undefined, // Use default full name from config
    description: 'Turn One is the ultimate Formula 1 platform for fans and creators, featuring real-time telemetry, live race tracking, F1 statistics, predictions, and interactive tools designed to turn race data into powerful insights.',
    keywords: [
        'F1 2026 season',
        'Formula 1 real-time data',
        'F1 multiplayer games',
        'F1 fantasy league',
        'Formula 1 championship',
    ],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#e10600',
};

export default function RootLayout({ children, }: {
    children: React.ReactNode
}) {
    // Generate structured data for the organization and website
    const organizationSchema = generateOrganizationSchema();
    const websiteSchema = generateWebsiteSchema();

    return (
        <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
            <head>
                {/* Structured Data for SEO */}
                <JsonLd data={[organizationSchema, websiteSchema]} />
                
                {/* Google AdSense */}
                <script 
                    async 
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9643370480021725"
                    crossOrigin="anonymous"
                />
                
                {/* DNS Prefetch for faster external resource loading */}
                <link rel="dns-prefetch" href="https://www.formula1.com" />
                <link rel="dns-prefetch" href="https://media.api-sports.io" />
            </head>
            {/* Google Analytics */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-KY3D64KP8W"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-KY3D64KP8W');
                `}
            </Script>
            <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <AuthProvider>
                        <VersionProvider>
                            <PageLoadingProvider>
                                <Suspense fallback={<Loading />}>
                                    {children}
                                </Suspense>
                                <Toaster />
                            </PageLoadingProvider>
                        </VersionProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
