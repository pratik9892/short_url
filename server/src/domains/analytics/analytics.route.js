import { Router } from "express"
import { getAnalyticsForAllLinks, getAnalyticsForLink } from "./analytics.contoller.js"
import { verifyJWT } from "../../middleware/auth.middleware.js"

const analyticsRouter = Router()

analyticsRouter.get("/all", verifyJWT, getAnalyticsForAllLinks)
analyticsRouter.get("/:linkId", verifyJWT, getAnalyticsForLink)

export { analyticsRouter }
