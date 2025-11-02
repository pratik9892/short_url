import { config } from "../config/server.config.js";
import { UserRepository } from "../domains/user/user.repo.js";
import jwt from "jsonwebtoken"

const userRepository = new UserRepository();

export async function verifyJWT(req,res,next){

    let token = req.header("Authorization")?.replace("Bearer " , "");
    
    if(!token && req.cookies?.accessToken){
        token = req.cookies?.accessToken
    }
    // console.log(token);
    
    
    if(!token){
        return next(new UnauthorizedError("Access token is missing."));
    }

    try {

        const decodedToken = jwt.verify(token,config.auth.ACCESS_TOKEN_SECRET)
        // console.log(decodedToken);
        
        const user = await userRepository.getUserWithId(decodedToken.userId)
        // console.log(user);
        
        if (!user) {
            return next(new UnauthorizedError('User session invalid or user does not exist.'));
        }
        req.user = user;
        next()
    } catch (error) {
        next(error)
    }

} 