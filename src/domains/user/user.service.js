import { ConflictError } from "../../errors/conflictError.js";
import { UserRepository } from "./user.repo.js";

export class UserService{
    constructor(UserRepository){
        this.UserRepository = UserRepository
    }

    async createAuthTokens(user){
    const refreshToken = generateRefreshToken({userId : user,_id});
    const hashedRefreshToken = await bcrypt.hash(refreshToken,10)
    await UserRepository.updateRefreshToken(user._id,hashedRefreshToken)

    const accessToken = generateAccessToken({userId : user._id})

    return {refreshToken,accessToken}
}

    async register(userData){
        try {
            const user = UserRepository.getUser(userData._id)

            if(user){
                throw new ConflictError("User exists with same credentials")
            }

            const hashedPassword = await bcrypt.hash(userData.password,10)
            const registeredUser = await UserRepository.register({username,fullName,email,password:hashedPassword,refreshToken})

            const {refreshToken,accessToken} = this.createAuthTokens(registeredUser)

            return {registeredUser, tokens : {refreshToken,accessToken}}

        } catch (error) {
            throw error
        }
    }
}