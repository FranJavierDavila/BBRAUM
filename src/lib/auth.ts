import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "eval_session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "eval-defectos-bbraun-secret-2026-fallback"
);

export type SessionPayload = {
  userId: string;
  username: string;
  role: "USER" | "ADMIN";
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

/**
 * Detecta si la petición llega a través de una pasarela HTTPS de cara al
 * navegador (p. ej. el proxy de vista previa, que internamente habla HTTP).
 *
 * - x-forwarded-proto: https  → HTTPS directo (IIS con TLS, túneles estándar).
 * - Cabecera "abc" de la pasarela de vista previa o host *.space-z.ai → la
 *   cara pública es HTTPS aunque el último tramo sea HTTP.
 *
 * En ese contexto embebido/de terceros los navegadores rechazan cookies
 * SameSite=Lax, por lo que hay que emitir SameSite=None; Secure (+ Partitioned
 * para seguir funcionando cuando Chrome bloquee cookies de terceros, CHIPS).
 */
async function isHttpsFacing(): Promise<boolean> {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (proto === "https") return true;

  const gwTag = h.get("abc") || "";
  const host = `${h.get("host") || ""} ${h.get("x-forwarded-host") || ""}`;
  if (gwTag.startsWith("preview-")) return true;
  if (/space-z\.ai/i.test(host)) return true;
  return false;
}

async function cookieBaseOptions() {
  const httpsFacing = await isHttpsFacing();
  return httpsFacing
    ? {
        httpOnly: true,
        sameSite: "none" as const,
        secure: true,
        partitioned: true,
        path: "/",
      }
    : {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: false,
        path: "/",
      };
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    ...(await cookieBaseOptions()),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    ...(await cookieBaseOptions()),
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId || !payload.username) return null;
    return {
      userId: String(payload.userId),
      username: String(payload.username),
      role: payload.role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return null;
  }
}
