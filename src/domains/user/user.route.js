import { Router } from "express";
import {
  getUser,
  login,
  logout,
  refreshAccessToken,
  register,
  updatePassword,
  updateUser,
} from "./user.contoller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.post("/login", login);
userRouter.post("/register", register);
userRouter.get("/refresh-token",refreshAccessToken);

// secured routes
userRouter.get("/logout", verifyJWT, logout);
userRouter.get("/user", verifyJWT, getUser);
userRouter.patch("/user/updatepassword", verifyJWT, updatePassword);
userRouter.patch("/user/update", verifyJWT, updateUser);

export { userRouter };
