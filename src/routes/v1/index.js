import { Router } from "express";
import userRouter from "./user.routes.js";
import linkRouter from "./link.routes.js";
import analyticsRouter from "./analytics.routes.js";

const v1Router = Router()

v1Router.use("/user" , userRouter)
v1Router.use("/link" , linkRouter)
v1Router.use("/analytics" , analyticsRouter)

export default v1Router