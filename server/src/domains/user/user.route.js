import { Router } from "express";
import {
  getUser,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  register,
  updatePassword,
  updateUser,
} from "./user.contoller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
  googleBodySchema,
  loginBodySchema,
  registerBodySchema,
} from "./user.validation.js";

const userRouter = Router();

userRouter.post("/login", validateBody(loginBodySchema), login);
userRouter.post("/google", validateBody(googleBodySchema), googleLogin);
userRouter.post("/register", validateBody(registerBodySchema), register);
userRouter.get("/refresh-token", refreshAccessToken);

// secured routes
userRouter.get("/logout", verifyJWT, logout);
userRouter.get("/user", verifyJWT, getUser);
userRouter.patch("/user/updatepassword", verifyJWT, updatePassword);
userRouter.patch("/user/update", verifyJWT, updateUser);

export { userRouter };
