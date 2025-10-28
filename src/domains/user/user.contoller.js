import { StatusCodes } from "http-status-codes"
import { NotImplemented } from "../../errors/notImplemented.js"
import { UserRepository } from "./user.repo.js"
import { UserService } from "./user.service.js"

const userService = new UserService(new UserRepository)


async function login(req,res,next){
    try {
        const {user , tokens} = await userService.login(req.body)

        const options = {
            httpOnly : true,
            secure : true
        }

        return res
           .status(StatusCodes.OK)
           .cookie("accessTokens",tokens.accessToken,options)
           .cookie("refreshToken",tokens.refreshToken,options)
           .json({
            success : true,
            message : "User Loggedin Successfully",
            error : {},
            data : user
           })
    } catch (error) {
        next(error)
    }
}

async function register(req,res,next){
    try {
        const user = await userService.register(req.body)
        
        return res
           .status(StatusCodes.CREATED)
           .json({
            success : true,
            message : "User Signup Successful",
            error : {},
            data : user
        })
    } catch (error) {
        next(error)
    }
}

async function getUser(req,res,next){
    try {
        throw new NotImplemented("get user")
    } catch (error) {
        next(error)
    }
}

async function updatePassword(req,res,next){
    try {
       throw new NotImplemented("update password")
    } catch (error) {
        next(error)
    }
}

async function updateUser(req,res,next){
    try {
       throw new NotImplemented("update user")
    } catch (error) {
        next(error)
    }
}

async function logout(req,res,next){
    try {
        const userId = req.user._id

        const result = await userService.logout(userId)

        const options = {
            httpOnly : true,
            secure : true
        }

        return res
            .status(StatusCodes.NO_CONTENT)
            .clearCookie("accessTokens",options)
            .clearCookie("refreshToken",options)
            .send() //no json as 204 status code so no content
    } catch (error) {
        next(error)
    }
}



export {
    login,
    register,
    getUser,
    updatePassword,
    logout,
    updateUser
}