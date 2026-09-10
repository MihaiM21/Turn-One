import { BookOpen, Eye, Lightbulb } from "lucide-react"
import { PublicCard } from "@/components/site/public-card"
import type { PlotExplainer } from "@/lib/plots/types"

/**
 * The "how to read this" panel that sits beside every Simple Mode chart.
 *
 * This is the point of Simple Mode. Rival tools all put their explanatory
 * material on a separate FAQ page, which is no use at the moment someone is
 * staring at a chart wondering what it means — so the explanation lives right
 * next to the thing being explained, and stays open rather than hiding behind a
 * tooltip.
 */
export function ExplainerPanel({ explainer }: { explainer: PlotExplainer }) {
  return (
    <PublicCard accent className="h-full p-5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          How to read this
        </p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-200">{explainer.whatItShows}</p>

      <ul className="mt-4 space-y-2">
        {explainer.howToRead.map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
            <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {explainer.whatToLookFor && (
        <div className="mt-4 flex gap-2.5 border-t border-zinc-800 pt-4">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
          <p className="text-sm leading-relaxed text-zinc-400">{explainer.whatToLookFor}</p>
        </div>
      )}

      {explainer.glossary && explainer.glossary.length > 0 && (
        <dl className="mt-4 space-y-2.5 border-t border-zinc-800 pt-4">
          {explainer.glossary.map((entry) => (
            <div key={entry.term}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                {entry.term}
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-zinc-500">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </PublicCard>
  )
}
