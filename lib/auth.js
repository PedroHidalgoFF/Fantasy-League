// lib/auth.js
// Autenticación simple de un solo usuario: tú. No hay usuarios ni registro,
// solo una contraseña guardada como variable de entorno (ADMIN_PASSWORD) y
// una cookie de sesión firmada con esa misma contraseña como secreto.

import crypto from "crypto";

const COOKIE_NAME = "ff_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

function sign(value) {
  const secret = process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionCookieValue() {
  const expires = Date.now() + SESSION_DURATION_MS;
  const value = `${expires}`;
  const signature = sign(value);
  return `${value}.${signature}`;
}

export function isValidSession(cookieValue) {
  if (!cookieValue) return false;
  const [value, signature] = cookieValue.split(".");
  if (!value || !signature) return false;
  if (sign(value) !== signature) return false;
  return Number(value) > Date.now();
}

export function checkPassword(password) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return password === process.env.ADMIN_PASSWORD;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
