import { SignJWT, jwtVerify } from "jose"

export const ANON_COOKIE_NAME = "t1_anon"
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

function secret() {
  const raw = process.env.ANON_COOKIE_SECRET || "turnone-anon-cookie-dev-secret-change-me"
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
