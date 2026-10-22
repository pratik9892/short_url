import { config } from "./server.config.js"

export function getCorsOptions() {
  const isProd = config.server.NODE_ENV === "production"
  const allowedOrigins = config.client.ORIGIN
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

  return {
    credentials: true,
    origin(origin, callback) {
      if (!isProd) {
        callback(null, true)
        return
      }
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked origin: ${origin}`))
    },
  }
}
