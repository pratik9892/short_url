import mongoose from "mongoose";
import { config } from "./server.config.js";

export async function connectToDB(){
    try {
        const connection = await mongoose.connect(config.db.MONGO_URI)
        console.log(`✅ MongoDB connected successfully to: ${connection.connection.host}`);
    } catch (error) {
        console.log("Error while connecting to mongo‼️‼️‼️");
        process.exit(1)
    }
}