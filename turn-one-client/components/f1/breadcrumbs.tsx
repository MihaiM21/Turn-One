import { PendingLink as Link } from "@/components/f1/pending-link"

export interface Crumb {
  name: string
  href: string
}

/** Visible breadcrumb trail. The last crumb is the current page and isn't a link. Pair with generateBreadcrumbSchema. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={c.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-zinc-300">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="underline-offset-4 hover:text-zinc-200 hover:underline">
                  {c.name}
                </Link>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
