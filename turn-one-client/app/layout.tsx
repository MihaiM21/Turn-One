import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, JetBrains_Mono } from "next/font/google"
import type React from "react"
import Script from "next/script"
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


// House type (t1-style): Barlow for text, Barlow Condensed for display, JetBrains Mono for numbers.
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow", display: "swap" })
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow-condensed", display: "swap" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono", display: "swap" })

// Enhanced SEO metadata for the entire application
export const metadata: Metadata = generateSEO({
    title: undefined, // Use default full name from config
    description: 'Turn One is sim racing telemetry for ACC, EA SPORTS F1 25/26 and iRacing. Turn One Link records every lap; the web shows where you lose time, corner by corner.',
    keywords: [
        'sim racing telemetry',
        'ACC telemetry',
        'F1 25 telemetry',
        'iRacing telemetry',
        'lap analysis',
    ],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#d40924',
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
            <body className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} antialiased`}>
                <ThemeProvider attribute="data-theme" themes={["t1"]} defaultTheme="t1" enableSystem={false} disableTransitionOnChange>
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
