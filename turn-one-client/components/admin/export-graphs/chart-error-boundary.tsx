"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

interface ChartErrorBoundaryProps {
  /** Changing this value resets the boundary (e.g. when switching plots). */
  resetKey?: unknown
  children: ReactNode
  /** Optional custom fallback height to match the preview area. */
  minHeight?: number
}

interface ChartErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time exceptions thrown by individual plot components so a
 * single malformed chart shows an inline message instead of escalating to the
 * app-wide error boundary (the full-page 500).
 */
export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  state: ChartErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("[ChartErrorBoundary] plot failed to render:", error)
  }

  componentDidUpdate(prevProps: ChartErrorBoundaryProps) {
    // Reset when the rendered chart/data changes so a new plot can render.
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 text-center"
          style={{ minHeight: this.props.minHeight ?? 700 }}
        >
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <span className="font-medium text-amber-400">Couldn’t render this chart</span>
          <span className="max-w-md text-xs text-zinc-500">
            The data for this session is in an unexpected shape. Try another
            session or plot.
          </span>
        </div>
      )
    }
    return this.props.children
  }
}
