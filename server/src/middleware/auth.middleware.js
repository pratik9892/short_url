import { config } from "../config/server.config.js"
import { UserRepository } from "../domains/user/user.repo.js"
import { UnauthorizedError } from "../errors/unauthorizedError.js"
import jwt from "jsonwebtoken"

const userRepository = new UserRepository()

export async function verifyJWT(req, res, next) {
  let token = req.header("Authorization")?.replace("Bearer ", "")

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken
  }

  if (!token) {
    return next(new UnauthorizedError("Access token is missing."))
  }

  try {
    const decodedToken = jwt.verify(token, config.auth.ACCESS_TOKEN_SECRET)
    const user = await userRepository.getUserWithId(decodedToken.userId)

    if (!user) {
      return next(new UnauthorizedError("User session invalid or user does not exist."))
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
