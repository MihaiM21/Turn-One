import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import type React from "react"
import { Toaster } from "react-hot-toast"
import { MainFooter } from "@/components/footer/main-footer"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import "./globals.css";


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
                        <Suspense fallback={null}>
                            {children}
                        </Suspense>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
