import mongoose from "mongoose";
import { config } from "./server.config.js";

export async function connectToDB(){
    try {
        await mongoose.connect(config.db.MONGO_URI)
    } catch (error) {
        console.log("Error while connecting to mongo‼️‼️‼️");
        
    }
}