"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

// Most errors here are the F1 API not having answered yet: right after a deploy
// the server is still collecting the season's data (it is rate limited), and a
// page asked for in that window gives up after ~25 s. It works a moment later,
// so retry by itself a few times instead of showing a dead end.
const RETRIES = 6
const RETRY_EVERY_MS = 10_000

export default function F1Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (attempt >= RETRIES) return
    const t = setTimeout(() => {
      setAttempt((a) => a + 1)
      reset()
    }, RETRY_EVERY_MS)
    return () => clearTimeout(t)
  }, [attempt, reset])

  const retrying = attempt < RETRIES

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center sm:px-6 lg:px-8" role="status" aria-live="polite">
      {retrying && <Loader2 className="mx-auto h-5 w-5 animate-spin text-red-500" />}
      <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">{retrying ? "Still loading F1 data" : "Couldn't load this page"}</h1>
      <p className="text-sm text-zinc-400">
        {retrying
          ? "The race data is still being collected, which can take a minute or two after an update. Trying again automatically…"
          : "The F1 data service didn't answer. Please try again in a moment."}
      </p>
      <div className="flex items-center justify-center gap-6 text-sm">
        <button type="button" onClick={() => reset()} className="text-red-400 underline-offset-4 hover:underline">
          Try now
        </button>
        <Link href="/f1" className="text-zinc-400 underline-offset-4 hover:underline">
          All sessions
        </Link>
      </div>
    </div>
  )
}
