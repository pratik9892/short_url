import express from "express"
import { apiRouter } from "./routes/index.js"
import {config} from "./config/server.config.js"
import { errHandler } from "./utils/error.util.js"
import { connectToDB } from "./config/mongodb.config.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import { configDotenv } from "dotenv"

configDotenv()
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
// routes
app.use("/api" , apiRouter)

app.get("/" , (req,res) => {

    return res.json({
        status : true,
        message : "OK"
    })
})

app.use(errHandler)

app.listen(config.server.PORT, async () => {
    console.log("Server is runnig on port " + config.server.PORT)
     await connectToDB()
})