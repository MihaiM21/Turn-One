import type React from "react"
import { MainNav } from "@/components/navigation/main-nav"
import { MainFooter } from "@/components/footer/main-footer"

// Public, no auth — same reasoning as app/plot/layout.tsx.
export default function F1SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />
      <main>{children}</main>
      <MainFooter />
    </div>
  )
}
