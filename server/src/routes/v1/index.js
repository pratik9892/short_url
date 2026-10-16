import { Router } from "express";
import { userRouter } from "../../domains/user/user.route.js";
import { linkRouter } from "../../domains/link/link.route.js";
import { analyticsRouter } from "../../domains/analytics/analytics.route.js";
import { aiRouter } from "../../domains/ai/ai.route.js";

const v1Router = Router()

v1Router.use("/auth" , userRouter)
v1Router.use("/link" , linkRouter)
v1Router.use("/analytics" , analyticsRouter)
v1Router.use("/ai" , aiRouter)

export {v1Router}