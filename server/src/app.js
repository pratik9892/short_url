import express from "express"
import { apiRouter } from "./routes/index.js"
import { config } from "./config/server.config.js"
import { getCorsOptions } from "./config/cors.config.js"
import { logRedisBootDiagnostics } from "./config/redis.config.js"
import { errHandler } from "./utils/error.util.js"
import { connectToDB } from "./config/mongodb.config.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import { configDotenv } from "dotenv"
import { redirectToLongUrl } from "./domains/link/link.contoller.js"

configDotenv()
const app = express()
app.set("trust proxy", 1)

app.use(cors(getCorsOptions()))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/health", (req, res) => {
  return res.json({
    status: true,
    message: "Everything is healty",
  })
})

app.use("/api", apiRouter)

app.get("/:shortCode", (req, res, next) => {
  const code = req.params.shortCode
  if (/\.[a-z0-9]{1,6}$/i.test(code)) return next()
  if (code === "health" || code === "api") return next()
  return redirectToLongUrl(req, res, next)
})

app.use(errHandler)

app.listen(config.server.PORT, async () => {
  logRedisBootDiagnostics()
  console.log("Server is runnig on port " + config.server.PORT)
  await connectToDB()
})
