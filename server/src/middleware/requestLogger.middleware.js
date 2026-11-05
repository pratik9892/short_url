import { randomUUID } from "node:crypto"
import { pinoHttp } from "pino-http"
import { logger } from "../infrastructure/logger/logger.js"

const REQUEST_ID = /^[\w-]{8,64}$/

/**
 * One log line per request with method, path, status and duration, plus req.log for handlers.
 * Reuses a valid incoming X-Request-Id so a request can be followed across services.
 * Client IPs, headers and bodies are deliberately left out.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incoming = req.headers["x-request-id"]
    const id = typeof incoming === "string" && REQUEST_ID.test(incoming) ? incoming : randomUUID()
    res.setHeader("X-Request-Id", id)
    return id
  },
  autoLogging: { ignore: (req) => req.url === "/health" },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return "error"
    if (res.statusCode >= 400) return "warn"
    return "info"
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
})
