import { StatusCodes } from "http-status-codes"
import { NotImplemented } from "../../errors/notImplemented.js"
import { UserRepository } from "./user.repo.js"
import { UserService } from "./user.service.js"

const UserrService = new UserService(new UserRepository)


async function login(req,res,next){
    try {
        throw new NotImplemented("login")
    } catch (error) {
        next(error)
    }
}

async function register(req,res,next){
    try {
        const {user , tokens} = await UserrService.register(req.body)
        console.log(req.body)
        return res.status(StatusCodes.CREATED).json({
            success : true,
            message : "Signup Successful",
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
     throw new NotImplemented("logout")
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