import jwt from "jsonwebtoken"

import { config } from "../config/server.config.js"

const ACCESS_TOKEN_SECRET = config.auth.ACCESS_TOKEN_SECRET
const ACCESS_TOKEN_EXPIRY = config.auth.ACCESS_TOKEN_EXPIRY
const REFRESH_TOKEN_SECRET = config.auth.REFRESH_TOKEN_SECRET
const REFRESH_TOKEN_EXPIRY = config.auth.REFRESH_TOKEN_SECRET

export function generateAccessToken(payload){
    return jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn:ACCESS_TOKEN_EXPIRY})
}

export function generateRefreshToken(payload){
    return jwt.sign(payload,REFRESH_TOKEN_SECRET,{expiresIn:REFRESH_TOKEN_EXPIRY})
}

export function verifyRefreshToken(token){
    try {
        return jwt.verify(token,REFRESH_TOKEN_SECRET)
    } catch (error) {
        return null
    }
}

