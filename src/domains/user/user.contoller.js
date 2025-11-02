import { StatusCodes } from "http-status-codes"
import { NotImplemented } from "../../errors/notImplemented.js"
import { UserRepository } from "./user.repo.js"
import { UserService } from "./user.service.js"

const userService = new UserService(new UserRepository)


async function login(req,res,next){
    try {
        const {user , tokens} = await userService.login(req.body)
        // console.log(user,tokens);
        
        const options = {
            httpOnly : true,
            secure : true
        }

        return res
           .status(StatusCodes.OK)
           .cookie("accessToken",tokens.accessToken,options)
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
        const user = await userService.getUser(req.user.id)

        return res
            .status(StatusCodes.ACCEPTED)
            .json({
                status : true,
                message : "User Fetched Successfully",
                error : {},
                data : user
            })
    } catch (error) {
        next(error)
    }
}

async function updatePassword(req,res,next){
    try {
        console.log(req.body);
        console.log(req.user);
        
        const updatedUser = await userService.updatePassword(req.user.id,req.body.oldPassword,req.body.newPassword)

        return res
            .status(StatusCodes.OK)
            .json({
                status : true,
                message : "User Password Updated Successfully",
                error : {},
                data : updatedUser
            })
    } catch (error) {
        next(error)
    }
}

async function updateUser(req,res,next){
    try {
       
        const updatedUser = await userService.updateUser(req.user.id,req.body)
        
        return res
           .status(StatusCodes.OK)
           .json({
            status : true,
            message : "User Updated Successfully",
            error : {},
            data : updatedUser
           })
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
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .send() //no json as 204 status code so no content
    } catch (error) {
        next(error)
    }
}

async function refreshAccessToken(req,res,next){
    try {
        // console.log(req.cookies.refreshToken);
        
        const {newRefreshToken,newAccessToken} = await userService.refreshAccessToken(req.cookies.refreshToken || req.body.refreshToken)
        
        const options = {
            httpOnly : true,
            secure : true
        }

        return res
            .status(StatusCodes.NO_CONTENT)
            .cookie("accessToken" , newAccessToken , options)
            .cookie("refreshToken" , newRefreshToken , options)
            .send() // no json as 204 status code so no content
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
    updateUser,
    refreshAccessToken
}