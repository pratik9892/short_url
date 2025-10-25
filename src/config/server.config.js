import { configDotenv } from "dotenv";

configDotenv()


export const config = {
    // Server
    server: {
        PORT: parseInt(process.env.PORT) || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development',
    },

    // // Database
    // db: {
    //     MONGO_URI: process.env.MONGO_URI,
    //     DB_NAME: process.env.DB_NAME,
    // },

    // // Security/Auth
    // auth: {
    //     JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-development-key',
    //     JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
    // },

    // // Redis Caching
    // redis: {
    //     HOST: process.env.REDIS_HOST || '127.0.0.1',
    //     PORT: parseInt(process.env.REDIS_PORT) || 6379,
    // }
};