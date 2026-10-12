"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SOCIAL_LINKS } from "@/lib/social-links"
import { useAuth } from "@/components/auth/auth-provider"
import { useSessionClock } from "@/hooks/use-session-clock"

/**
 * The public site header, in the landing page's language: near-black, square
 * edges, small uppercase tracked labels, crimson only for the call to action
 * and the active marker.
 *
 * - Transparent and full-width over the top of the page. Once you scroll it drops
 *   a little from the top edge and settles into a floating island (rounded,
 *   blurred, shadowed) that stays with you all the way down.
 * - Wide screens (xl) show every link; lg shows the primary ones plus the menu
 *   button; below lg it's logo + CTA + menu. The menu is a full-screen sheet.
 */

type Item = { href: string; label: string; secondary?: boolean }

const ITEMS: Item[] = [
  { href: "/live", label: "Live" },
  { href: "/features", label: "Features" },
  { href: "/f1", label: "Sessions" },
  { href: "/news", label: "News" },
  { href: "/pricing", label: "Pricing" },
  { href: "/examples", label: "Examples", secondary: true },
  { href: "/how-it-works", label: "How it works", secondary: true },
  { href: "/api-launch", label: "API", secondary: true },
]

const isActive = (pathname: string | null, href: string) => !!pathname && (pathname === href || pathname.startsWith(`${href}/`))

/** Red dot next to "Live" while a session is actually running. Checks once a minute. */
function LiveDot() {
  const { pick } = useSessionClock(60_000)
  if (!pick?.live) return null
  return (
    <span className="relative ml-1.5 inline-flex h-1.5 w-1.5" aria-label="Session live now">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
    </span>
  )
}

export function MainNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuId = useId()
  const button = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  // Scroll state, rAF-throttled: the island forms after 24px.
  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrolled(window.scrollY > 24)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Open menu: lock page scroll, focus the first link, Escape closes and returns focus.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = "hidden"
    firstLink.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        button.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      root.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  const island = scrolled || open

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          island ? "pt-3" : "pt-0",
        )}
      >
        <a
          href="#main"
          onClick={(e) => {
            // pages don't share an id, but they all render a <main>
            const main = document.querySelector("main")
            if (!main) return
            e.preventDefault()
            main.tabIndex = -1
            main.focus()
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>

        <nav
          aria-label="Main"
          // One box in both states, so nothing jumps: it narrows, rounds, gains the plate and the shadow.
          style={{ width: island ? "calc(100% - 1.5rem)" : "100%", maxWidth: island ? "68rem" : "72rem" }}
          className={cn(
            "mx-auto flex items-center gap-6 border px-4 transition-[width,max-width,height,border-radius,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-6",
            island
              ? "h-14 rounded-2xl border-white/10 bg-[#050505]/80 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:px-5"
              : "h-16 rounded-none border-transparent bg-transparent lg:px-8",
          )}
        >
          <Link href="/" aria-label="Turn One — home" className="-m-1 shrink-0 p-1" onClick={close}>
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              priority
              className={cn("transition-[width,height] duration-500", island ? "h-8 w-8" : "h-9 w-9")}
            />
          </Link>

          <ul className="hidden flex-1 items-center gap-1 lg:flex">
            {ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href} className={cn(item.secondary && "hidden xl:block")}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center px-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors",
                      active ? "text-white" : "text-zinc-400 hover:text-white",
                    )}
                  >
                    {item.label}
                    {item.href === "/live" && <LiveDot />}
                    {/* active marker: a short crimson tick under the label */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 bottom-1 mx-auto h-0.5 w-4 rounded-full bg-red-500 transition-transform duration-300",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {isAuthenticated ? (
              <NavCta href="/dashboard" onClick={close}>
                Dashboard
              </NavCta>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden h-9 items-center rounded-lg px-3.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex"
                >
                  Log in
                </Link>
                <NavCta href="/auth/signup" onClick={close}>
                  Start free
                </NavCta>
              </>
            )}

            <button
              ref={button}
              type="button"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
              className="relative -mr-2 inline-flex h-10 w-10 items-center justify-center text-zinc-300 hover:text-white xl:hidden"
            >
              {/* two bars → X */}
              <span
                aria-hidden
                className={cn("absolute h-px w-5 bg-current transition-transform duration-300", open ? "rotate-45" : "-translate-y-[3px]")}
              />
              <span
                aria-hidden
                className={cn("absolute h-px w-5 bg-current transition-transform duration-300", open ? "-rotate-45" : "translate-y-[3px]")}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen menu sheet (below xl). A sibling of the header, not a child: the header's
          backdrop-filter/transform would make it the containing block for this fixed element. */}
      <div
        id={menuId}
        hidden={!open}
        className="fixed inset-x-3 bottom-3 top-[4.75rem] z-50 overflow-y-auto rounded-2xl border border-white/10 bg-[#050505]/95 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl xl:hidden"
      >
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8">
          <ul className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
            {ITEMS.map((item, i) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    ref={i === 0 ? firstLink : undefined}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="group flex items-center justify-between py-4"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[10px] tabular-nums text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
                      <span
                        className={cn("text-2xl font-black tracking-tight", active ? "text-white" : "text-zinc-300 group-hover:text-white")}
                      >
                        {item.label}
                        {item.href === "/live" && <LiveDot />}
                      </span>
                    </span>
                    <ArrowRight
                      className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", active ? "text-red-500" : "text-zinc-600")}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
            {isAuthenticated ? (
              <NavCta href="/dashboard" onClick={close} className="h-11 w-full">
                Open dashboard
              </NavCta>
            ) : (
              <>
                <NavCta href="/auth/signup" onClick={close} className="h-11 w-full">
                  Start free
                </NavCta>
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 text-sm font-medium text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
                >
                  Log in
                </Link>
              </>
            )}
            <Link
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white sm:col-span-2"
            >
              <Image src="/discord.svg" alt="" width={14} height={14} />
              Join the Discord
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function NavCta({
  href,
  onClick,
  className,
  children,
}: {
  href: string
  onClick?: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_20px_-6px_rgba(212,9,36,0.6)] transition-[background-color,box-shadow] hover:bg-red-500",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
