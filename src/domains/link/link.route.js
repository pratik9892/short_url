import { Router } from "express";
import { createShortUrl, deleteShortUrl, getAllShortUrl, getShortUrl, updateShortUrl } from "./link.contoller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const linkRouter = Router()

// secured routes (only auth users can access them)
linkRouter.post("/create" ,verifyJWT, createShortUrl)
linkRouter.get("/me" ,verifyJWT, getAllShortUrl)
linkRouter.get("/:id" ,verifyJWT, getShortUrl)
linkRouter.patch("/:id" , verifyJWT,updateShortUrl)
linkRouter.delete("/:id" ,verifyJWT, deleteShortUrl)

export {linkRouter}