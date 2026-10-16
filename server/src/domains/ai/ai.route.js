import { Router } from "express"
import {
  postDashboardInsight,
  postSuggestName,
  getLinkAIAnalytics,
  getAIStatus,
  postAsk,
} from "./ai.controller.js"
import { verifyJWT } from "../../middleware/auth.middleware.js"

const aiRouter = Router()

aiRouter.get("/status", verifyJWT, getAIStatus)
aiRouter.post("/insight", verifyJWT, postDashboardInsight)
aiRouter.post("/suggest-name", verifyJWT, postSuggestName)
aiRouter.post("/ask", verifyJWT, postAsk)
aiRouter.get("/analytics/:linkId", verifyJWT, getLinkAIAnalytics)

export { aiRouter }
