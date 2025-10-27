import { configDotenv } from "dotenv";

configDotenv()


export const config = {
    // Server
    server: {
        PORT: parseInt(process.env.PORT) || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development',
    },

     // Database
    db: {
        MONGO_URI: process.env.MONGO_URI,
        DB_NAME: process.env.DB_NAME,
    },

    // // Security/Auth
    auth: {
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'PRATIK1234',
        ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '4h',
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'PRATIK1234',
        REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '4d',
    },

    // // Redis Caching
    redis: {
        HOST: process.env.REDIS_HOST || '127.0.0.1',
        PORT: parseInt(process.env.REDIS_PORT) || 6379,
    }
};