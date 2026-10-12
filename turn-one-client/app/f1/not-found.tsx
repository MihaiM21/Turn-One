import Link from "next/link"

// 404 for /f1/** — a session that hasn't happened, hasn't been published yet,
// or never existed. Gives the visitor (and the crawler) somewhere real to go.
export default function F1NotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">404</p>
      <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">That session isn&apos;t available</h1>
      <p className="text-sm text-zinc-400">
        Results are published as soon as a session has finished and its data is ready. If the session hasn&apos;t run yet, check back after it has.
      </p>
      <Link href="/f1" className="inline-block text-sm text-red-400 underline-offset-4 hover:underline">
        Browse every published session →
      </Link>
    </div>
  )
}
