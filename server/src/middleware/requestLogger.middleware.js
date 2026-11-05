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
  genReqId(req, res) { // if the headers don't have an X-Request-Id it creates one and sets it; important because we can trace a request by its id
    const incoming = req.headers["x-request-id"]
    const id = typeof incoming === "string" && REQUEST_ID.test(incoming) ? incoming : randomUUID()
    res.setHeader("X-Request-Id", id)
    return id
  },
  autoLogging: { ignore: (req) => req.url === "/health" }, // skip /health: Docker and uptime checks hit it every 30s and would flood the logs
  customLogLevel(req, res, err) { // chooses the log level according to the status code
    if (err || res.statusCode >= 500) return "error"
    if (res.statusCode >= 400) return "warn"
    return "info"
  },
  serializers: { // log only useful fields, never private or confidential data like headers and cookies
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
})
