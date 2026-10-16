import { config } from "./server.config.js";

export const REDIS_CONNECTION = {
    host : config.redis.HOST,
    port : config.redis.PORT
}