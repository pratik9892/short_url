import path from "node:path"
import pino from "pino"
import { config } from "../../config/server.config.js"

const env = config.server.NODE_ENV

// app.js and worker.js share every module, so tag lines by the entry script that started this process
const service = path.basename(process.argv[1] || "", ".js") === "worker" ? "worker" : "api"

/** Keeps the first character and the domain: pratik@gmail.com -> p***@gmail.com */
export function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) return "[Redacted]"
  const [name, domain] = email.split("@")
  return `${name.slice(0, 1)}***@${domain}`
}

/** Secrets and personal data that must never reach the logs, wherever they appear one level deep. */
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "*.password",
  "*.oldPassword",
  "*.newPassword",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.idToken",
  "*.credential",
  "*.apiKey",
  "*.email",
]

export const redact = {
  paths: REDACT_PATHS,
  censor: (value, redactPath) => (redactPath[redactPath.length - 1] === "email" ? maskEmail(value) : "[Redacted]"),
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (env === "test" ? "silent" : env === "production" ? "info" : "debug"),
  base: { service },
  redact,
  // readable, colored lines locally; plain JSON everywhere else (pino-pretty is a dev dependency)
  ...(env === "development" && {
    transport: { target: "pino-pretty", options: { translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" } },
  }),
})
