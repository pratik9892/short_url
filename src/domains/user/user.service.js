import { ConflictError } from "../../errors/conflictError.js";
import { UnauthorizedError } from "../../errors/unauthorizedError.js";
import {generateAccessToken,generateRefreshToken} from "../../utils/jwt.util.js"
import bcrypt from "bcrypt"

export class UserService{
    constructor(userRepository){
        this.UserRepository = userRepository
    }

    async createAuthTokens(user){
    const refreshToken = generateRefreshToken({userId : user._id});
    const hashedRefreshToken = await bcrypt.hash(refreshToken,10)
    await this.UserRepository.updateRefreshToken(user._id,hashedRefreshToken)

    const accessToken = generateAccessToken({userId : user._id})

    return {refreshToken,accessToken}
}

    async register(userData){
        try {
            const userExists = await this.UserRepository.getUser(userData.username,userData.email,false)
            
            if(userExists){
                throw new ConflictError("User exists with same credentials")
            }

            const hashedPassword = await bcrypt.hash(userData.password,10)
            
            const registeredUser = await this.UserRepository.register({
                username:userData.username,
                fullName:userData.fullName,
                email:userData.email,
                password:hashedPassword
            })

            return registeredUser

        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async login(userData){
        try {
            //we will get userdata such as username and password from controller
            //we first get the user from findbyusername
            //if we donnot get user tell user to register and if we get user move to next step
            //if we find user we will compare the password given by user and one in the db
            //if pass is correct generate tokens and save if pass is wrong send wrong pass error
            const userExists = await this.UserRepository.getUser(null,userData.email,true,false)
            
            if(!userExists){
                throw new UnauthorizedError("Invalid Credentials")
            }

            const isPasswordCorrect = await bcrypt.compare(userData.password,userExists.password)

            if(!isPasswordCorrect){
                throw new UnauthorizedError("Invalid Credentials")
            }

            const {accessToken,refreshToken} = await this.createAuthTokens(userExists)

            return {userExists , tokens : {accessToken,refreshToken}}
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async logout(userId){
        try {
            const logoutUser = await this.UserRepository.updateRefreshToken(userId,null)

            return logoutUser;
        } catch (error) {
            console.log(error)
            throw error
        }
    }
}

