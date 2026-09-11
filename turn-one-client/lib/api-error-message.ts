/**
 * Turns an upstream failure into something safe to show a person.
 *
 * The external F1 API sits behind Cloudflare, which answers an origin failure
 * with a full HTML error page — and serves it as `text/plain`, so the content
 * type cannot be trusted to identify it. Passing that body through verbatim,
 * as the proxy previously did, dumped an entire Cloudflare page into the UI in
 * place of an error message.
 *
 * Shared by the server proxy and the browser fetchers so both describe the same
 * failure the same way.
 */

/** Longer than any legitimate error message this API produces. */
const MAX_PASSTHROUGH_LENGTH = 300

/**
 * Statuses meaning "the service is reachable but not answering properly".
 * Distinct from a 404, which means the data genuinely is not there.
 */
export function isTransientUpstreamStatus(status: number): boolean {
  return status === 502 || status === 504 || status === 429
}

/** True when a body is a web page rather than an API payload. */
export function looksLikeHtml(text: string): boolean {
  const head = text.slice(0, 500).trimStart().toLowerCase()
  return (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    (head.includes("<head") && head.includes("<body")) ||
    head.includes("<title>")
  )
}

/** A plain-language description of a failure status. */
export function messageForStatus(status: number): string {
  if (status === 502 || status === 504) {
    return `The F1 data service is temporarily unavailable (error ${status}). This is usually brief — please try again in a moment.`
  }
  if (status === 429) {
    return "Too many requests to the F1 data service. Please wait a moment and try again."
  }
  if (status === 503) {
    return "The F1 data service is busy preparing this data. Please try again shortly."
  }
  if (status === 404) {
    return "No data is available for this session yet."
  }
  if (status >= 500) {
    return `The F1 data service ran into a problem (error ${status}). Please try again.`
  }
  return `The F1 data request failed (error ${status}).`
}

/**
 * Picks the message to show for an upstream error body, discarding anything
 * that is a web page or implausibly long rather than a real message.
 */
export function sanitizeErrorMessage(raw: unknown, status: number): string {
  if (typeof raw !== "string") return messageForStatus(status)
  const text = raw.trim()
  if (!text) return messageForStatus(status)
  if (looksLikeHtml(text)) return messageForStatus(status)
  if (text.length > MAX_PASSTHROUGH_LENGTH) return messageForStatus(status)
  return text
}
