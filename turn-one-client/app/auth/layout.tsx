import type React from "react"
import { LegalDisclaimer } from "@/components/footer/legal-disclaimer"

// /auth/* has no MainFooter, so it's the one footerless route group with
// real page content that still needs the disclaimer visible.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="container mx-auto px-4 py-4">
        <LegalDisclaimer variant="minimal" className="text-center" />
      </div>
    </>
  )
}
