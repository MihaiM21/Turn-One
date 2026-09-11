import { MainNav } from "@/components/navigation/main-nav";

/**
 * Route-level skeleton. Without this the whole page fell back to the app-wide
 * spinner, which says nothing about what is arriving; these blocks match the
 * real section layout so the page does not jump when the data lands.
 */
export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-black">
      <MainNav variant="homepage" />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-24 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className="h-3 w-40 animate-pulse bg-zinc-900" />
          <div className="h-12 w-80 animate-pulse bg-zinc-900" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-zinc-900" />
        </div>

        <div className="h-16 animate-pulse border border-zinc-800 bg-zinc-900/40" />

        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse bg-zinc-900" />
          <div className="h-72 animate-pulse border border-zinc-800 bg-zinc-900/40" />
        </div>

        <div className="h-80 animate-pulse border border-zinc-800 bg-zinc-900/40" />

        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 animate-pulse border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      </main>
    </div>
  );
}
