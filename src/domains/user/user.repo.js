import { NotFound } from "../../errors/NotFound.js";
import { User } from "./user.model.js";

export class UserRepository {
    async register(userData){
        try {
            const user = await User.create({
                username : userData.username.toLowerCase(),
                fullName : userData.fullName,
                email : userData.email,
                password : userData.password,
                refreshToken : userData.refreshToken || ""
            })

            return user 
        } catch (error) {
            throw error
        }
    }

    async getUser(id){
        try {
            const user = await User.findById(id)

            if(!user){
                throw new NotFound("User" , id)
            }
            return user
        } catch (error) {
            throw error
        }
    }

    async updateUser(id,userData){
        try {
            const updatedUser = await User.findByIdAndUpdate(id,{
                username : userData.username,
                fullName : userData.fullName,
                email : userData.email,
            })

            if(!updatedUser){
                throw new NotFound("Update User" , id)
            }
            return updatedUser
        } catch (error) {
            throw error
        }
    }

    async updateRefreshToken(id,refreshToken){
        try {
            const updatedRefreshToken = await User.findById(id,{
                refreshToken : refreshToken
            })
            
            if(!updatedRefreshToken){
                throw new NotFound("Refresh Token" , id)
            }
        } catch (error) {
            throw error
        }
    }

}