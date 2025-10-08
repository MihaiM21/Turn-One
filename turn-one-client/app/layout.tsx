import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import type React from "react"
import { MainFooter } from "@/components/footer/main-footer"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { PageLoadingProvider } from "@/components/providers/page-loading-provider";
import { VersionProvider } from "@/components/providers/version-provider";


export const metadata: Metadata = {
  title: "Turn One",
  description: "Turn One",
};

export default function RootLayout({children,}: {
    children: React.ReactNode
}) {
    return (
        <html className="dark" style={{colorScheme:"dark"}}>
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
