import { SignJWT, jwtVerify } from "jose"

export const ANON_COOKIE_NAME = "t1_anon"
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

function secret() {
  // Never fall back to a value that is in the public repo outside development. Deriving from
  // JWT_SECRET (with a prefix, so the two keys never verify each other's tokens) keeps the site
  // working until ANON_COOKIE_SECRET is set.
  const raw =
    process.env.ANON_COOKIE_SECRET ||
    (process.env.JWT_SECRET ? `anon-cookie:${process.env.JWT_SECRET}` : null) ||
    (process.env.NODE_ENV !== "production" ? "turnone-anon-cookie-dev-secret-change-me" : null)
  if (!raw) throw new Error("ANON_COOKIE_SECRET is not set")
  return new TextEncoder().encode(raw)
}

/** Signs a small JWT carrying only a random id — used as the anonymous identity cookie. */
export async function signAnonCookie(anonId: string): Promise<string> {
  return new SignJWT({ sub: anonId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_YEAR_SECONDS}s`)
    .sign(secret())
}

export async function verifyAnonCookie(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

export function newAnonId(): string {
  return crypto.randomUUID()
}
