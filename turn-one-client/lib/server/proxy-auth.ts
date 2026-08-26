import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { ANON_COOKIE_NAME, verifyAnonCookie } from "./anon-cookie"

export type ProxyAuthResult =
  | { mode: "user"; userId: string }
  | { mode: "anon"; anonId: string }
  | { mode: "deny" }

function jwtSecret() {
  const raw = process.env.JWT_SECRET
  if (!raw) return null
  return new TextEncoder().encode(raw)
}

async function verifyBackendJwt(token: string): Promise<string | null> {
  const key = jwtSecret()
  if (!key) return null
  try {
    // Signature + expiry only — this proves the token was minted by the
    // backend, which is all the proxy needs to know before spending upstream
    // API quota on the caller's behalf. Full claim validation (issuer,
    // audience, roles) belongs to the backend endpoints those claims gate.
    const { payload } = await jwtVerify(token, key)
    // JwtSecurityTokenHandler's default outbound claim map serializes
    // ClaimTypes.NameIdentifier as "nameid", not "sub" — see AuthService.GenerateJwtToken.
    const subject = payload["nameid"] ?? payload.sub
    return typeof subject === "string" ? subject : null
  } catch {
    return null
  }
}

/**
 * Closes the previously-open catch-all proxy: every request must carry either
 * a valid backend JWT or a valid signed anon cookie. This is coarse identity
 * gating (proves a real client hit the site first), not per-feature
 * authorization — per-feature limits (plan gates) are enforced by their own
 * endpoints.
 */
export async function authorizeProxyRequest(request: NextRequest): Promise<ProxyAuthResult> {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const userId = await verifyBackendJwt(authHeader.slice("Bearer ".length))
    if (userId) return { mode: "user", userId }
  }

  const anonCookie = request.cookies.get(ANON_COOKIE_NAME)?.value
  if (anonCookie) {
    const anonId = await verifyAnonCookie(anonCookie)
    if (anonId) return { mode: "anon", anonId }
  }

  return { mode: "deny" }
}
