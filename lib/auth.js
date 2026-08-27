// lib/auth.js
// Autenticación simple de un solo usuario: tú. No hay usuarios ni registro,
// solo una contraseña guardada como variable de entorno (ADMIN_PASSWORD) y
// una cookie de sesión firmada con esa misma contraseña como secreto.
//
// Usa la Web Crypto API (globalThis.crypto.subtle) en vez del módulo
// "crypto" de Node.js, porque el middleware de Next.js corre en el Edge
// Runtime de Vercel, que no soporta módulos nativos de Node.

const COOKIE_NAME = "ff_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

async function getKey() {
  const secret = process.env.ADMIN_PASSWORD || "";
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(value) {
  const key = await getKey();
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionCookieValue() {
  const expires = Date.now() + SESSION_DURATION_MS;
  const value = `${expires}`;
  const signature = await sign(value);
  return `${value}.${signature}`;
}

export async function isValidSession(cookieValue) {
  if (!cookieValue) return false;
  const [value, signature] = cookieValue.split(".");
  if (!value || !signature) return false;
  const expectedSignature = await sign(value);
  if (expectedSignature !== signature) return false;
  return Number(value) > Date.now();
}

export function checkPassword(password) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return password === process.env.ADMIN_PASSWORD;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
