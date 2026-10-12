"use client"

import Link, { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"
import type { ComponentProps } from "react"

// A session page that hasn't been rendered yet can take several seconds (the F1
// API is slow the first time it is asked for a session). Next keeps the old
// page on screen while that happens, so a click looks like it did nothing.
// This shows that it did: a spinner next to the clicked link and a thin
// progress bar across the top of the window.

function Pending() {
  const { pending } = useLinkStatus()
  return (
    <>
      {/* fixed-size slot so the spinner never shifts the text */}
      <span aria-hidden className="ml-1.5 inline-block h-3 w-3 align-[-2px]">
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
      </span>
      {pending && (
        <span role="status" aria-label="Loading" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-red-950">
          <span className="block h-full w-1/3 animate-[f1-progress_1.1s_ease-in-out_infinite] bg-red-500" />
        </span>
      )}
    </>
  )
}

/**
 * next/link with a visible pending state. Prefetching is off by default: on the
 * /f1 index there are dozens of session links in view, and prefetching them
 * renders (and fetches API data for) pages nobody asked for.
 */
export function PendingLink({ children, prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link prefetch={prefetch} {...props}>
      {children}
      <Pending />
    </Link>
  )
}
