import { Router } from "express";
import { getUser, login, logout, register, updatePassword, updateUser } from "./user.contoller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const userRouter = Router()

userRouter.post("/login" , login)
userRouter.post("/register" , register)
userRouter.get("/logout" , verifyJWT,logout)
userRouter.get("/user/:id" , getUser)
userRouter.patch("/user/updatepassword/:id" , updatePassword)
userRouter.patch("/user/updateuser/:id" , updateUser)

export {userRouter}