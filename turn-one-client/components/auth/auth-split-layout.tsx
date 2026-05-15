import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

interface AuthSplitLayoutProps {
  left: ReactNode
  children: ReactNode
}

export function AuthSplitLayout({ left, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between p-10 border-r border-border overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]"
        />

        <Link href="/" className="relative z-10 inline-flex items-center" aria-label="Turn One home">
          <Image src="/logo.png" alt="Turn One" width={48} height={48} className="h-10 w-auto" priority />
        </Link>

        <div className="relative z-10 max-w-md">{left}</div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © 2026 Turn One. Not affiliated with Formula 1 or the FIA.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
