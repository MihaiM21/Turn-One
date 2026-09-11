import { Flag, Gauge, Layers, TrendingUp, Users, type LucideIcon } from "lucide-react"
import { PLOT_BY_KEY, isSessionRestricted } from "./catalog"
import type { PlotDefinition } from "./types"

/**
 * Simple Mode reframes the catalogue as questions instead of chart types.
 *
 * The expert generator opens on a grid of 26 plot names, which assumes you
 * already know which chart answers your question. A newcomer does not, so this
 * layer asks the question first and picks the chart itself.
 *
 * Every plot referenced here must be free (never `isPro`) — Simple Mode is a
 * public, no-login page, so surfacing PRO plots through it would give away the
 * paid tier. See SIMPLE_MODE_PLOT_KEYS for the assertion that keeps this true.
 */
export interface SimpleModeQuestion {
  id: string
  /** The question as a visitor would phrase it. */
  question: string
  /** One line of plain English under the question. */
  blurb: string
  icon: LucideIcon
  /**
   * Plots that answer this question, best first. More than one becomes a tab
   * strip, so a visitor can see several angles without re-picking a question.
   */
  plotKeys: string[]
}

export const SIMPLE_MODE_QUESTIONS: SimpleModeQuestion[] = [
  {
    id: "fastest",
    question: "Who was fastest?",
    blurb: "Top speeds by team, and the order they finished the session in.",
    icon: Gauge,
    plotKeys: ["topspeeds", "session_results"],
  },
  {
    id: "pace",
    question: "How did the pace change?",
    blurb: "Lap times through the session — where drivers gained and lost time.",
    icon: TrendingUp,
    plotKeys: ["laptime", "lap_distribution"],
  },
  {
    id: "strategy",
    question: "What was the tyre strategy?",
    blurb: "Which compounds each driver ran, and when they stopped.",
    icon: Layers,
    plotKeys: ["tyre_stint"],
  },
  {
    id: "head-to-head",
    question: "How do two drivers compare?",
    blurb: "Put two drivers side by side around a lap of the circuit.",
    icon: Users,
    plotKeys: ["track_comparison", "throttle_brake", "speed_distribution"],
  },
  {
    id: "flat-out",
    question: "Who was flat out the most?",
    blurb: "Average throttle per driver — who commits hardest through the corners.",
    icon: Flag,
    plotKeys: ["throttle_average"],
  },
]

/** Every plot key Simple Mode can reach. */
export const SIMPLE_MODE_PLOT_KEYS: string[] = [
  ...new Set(SIMPLE_MODE_QUESTIONS.flatMap((q) => q.plotKeys)),
]

/** Resolves a question's plots, dropping any that are missing or PRO-gated. */
export function plotsForQuestion(question: SimpleModeQuestion): PlotDefinition[] {
  return question.plotKeys
    .map((key) => PLOT_BY_KEY.get(key))
    .filter((def): def is PlotDefinition => Boolean(def) && !def!.isPro)
}

/**
 * Questions answerable for the given session. Some plots only make sense for a
 * race (tyre strategy, for one), and offering a question that cannot be
 * answered is exactly the dead end Simple Mode exists to avoid.
 */
export function questionsForSession(sessionCode: string): SimpleModeQuestion[] {
  return SIMPLE_MODE_QUESTIONS.filter((question) =>
    plotsForQuestion(question).some((def) => !isSessionRestricted(def, sessionCode)),
  )
}

/** The best available plot for a question in a given session, or null. */
export function defaultPlotFor(
  question: SimpleModeQuestion,
  sessionCode: string,
): PlotDefinition | null {
  const usable = plotsForQuestion(question).filter((def) => !isSessionRestricted(def, sessionCode))
  return usable[0] ?? null
}
