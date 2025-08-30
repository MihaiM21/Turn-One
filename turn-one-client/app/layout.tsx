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
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turn One",
  description: "Turn One",
};

export default function RootLayout({children,}: {
    children: React.ReactNode
}) {
    return (
        <html>
            <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <Suspense fallback={null}>
                        {children}
                        <MainFooter />
                        <Toaster />
                    </Suspense>
                </ThemeProvider>
            </body>
        </html>
    )
}
