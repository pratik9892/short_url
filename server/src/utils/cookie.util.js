import { config } from "../config/server.config.js"

export function authCookieOptions() {
  const isProduction = config.server.NODE_ENV === "production"
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  }
}
