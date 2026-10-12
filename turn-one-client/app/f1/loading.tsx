import { Loader2 } from "lucide-react"

// Shown inside the F1 layout (nav and footer stay put) while a page renders.
// The first visit to a session can take several seconds: the F1 API computes
// its data the first time it is asked.
export default function F1Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
        <span>Loading session data… the first load of a session can take a few seconds.</span>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-48 animate-pulse bg-zinc-900" />
        <div className="h-8 w-2/3 animate-pulse bg-zinc-900" />
        <div className="h-4 w-1/2 animate-pulse bg-zinc-900" />
      </div>
      <div className="h-96 animate-pulse border border-zinc-900 bg-zinc-950" />
    </div>
  )
}
