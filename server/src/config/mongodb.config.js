import mongoose from "mongoose";
import { config } from "./server.config.js";
import { logger } from "../infrastructure/logger/logger.js";

export async function connectToDB(){
    try {
        const connection = await mongoose.connect(config.db.MONGO_URI)
        logger.info({ host: connection.connection.host }, "MongoDB connected");
    } catch (error) {
        logger.fatal({ err: error }, "MongoDB connection failed");
        process.exit(1)
    }
}