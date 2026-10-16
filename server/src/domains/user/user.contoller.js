import { StatusCodes } from "http-status-codes"
import { UserRepository } from "./user.repo.js"
import { UserService } from "./user.service.js"
import { authCookieOptions } from "../../utils/cookie.util.js"
import { verifyGoogleIdToken } from "./googleAuth.service.js"

const userService = new UserService(new UserRepository())

function currentUserId(req) {
  return req.user._id ?? req.user.id
}

function sendAuthSuccess(res, user, tokens, message) {
  const options = authCookieOptions()
  return res
    .status(StatusCodes.OK)
    .cookie("accessToken", tokens.accessToken, options)
    .cookie("refreshToken", tokens.refreshToken, options)
    .json({
      success: true,
      message,
      error: {},
      data: {
        ...(typeof user.toJSON === "function" ? user.toJSON() : user),
        accessToken: tokens.accessToken,
      },
    })
}

async function login(req, res, next) {
  try {
    const { user, tokens } = await userService.login(req.body)
    return sendAuthSuccess(res, user, tokens, "User Loggedin Successfully")
  } catch (error) {
    next(error)
  }
}

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body || {}
    const profile = await verifyGoogleIdToken(credential)
    const { user, tokens } = await userService.loginWithGoogleProfile(profile)
    return sendAuthSuccess(res, user, tokens, "Google login successful")
  } catch (error) {
    next(error)
  }
}

async function register(req, res, next) {
  try {
    const user = await userService.register(req.body)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User Signup Successful",
      error: {},
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUser(currentUserId(req))

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User Fetched Successfully",
      error: {},
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function updatePassword(req, res, next) {
  try {
    const updatedUser = await userService.updatePassword(
      currentUserId(req),
      req.body.oldPassword,
      req.body.newPassword
    )

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User Password Updated Successfully",
      error: {},
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

async function updateUser(req, res, next) {
  try {
    const updatedUser = await userService.updateUser(currentUserId(req), req.body)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User Updated Successfully",
      error: {},
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

async function logout(req, res, next) {
  try {
    await userService.logout(req.user._id)
    const options = authCookieOptions()

    return res
      .status(StatusCodes.NO_CONTENT)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .send()
  } catch (error) {
    next(error)
  }
}

async function refreshAccessToken(req, res, next) {
  try {
    const { newRefreshToken, newAccessToken } = await userService.refreshAccessToken(
      req.cookies.refreshToken || req.body.refreshToken
    )
    const options = authCookieOptions()

    return res
      .status(StatusCodes.OK)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        success: true,
        message: "Token refreshed",
        error: {},
        data: { accessToken: newAccessToken },
      })
  } catch (error) {
    next(error)
  }
}

export {
  login,
  googleLogin,
  register,
  getUser,
  updatePassword,
  logout,
  updateUser,
  refreshAccessToken,
}
