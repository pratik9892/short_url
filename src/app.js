import express from "express"
import bodyParser from "body-parser"
import { apiRouter } from "./routes/index.js"
import {config} from "./config/server.config.js"
import { errHandler } from "./utils/error.util.js"

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.text())

// routes
app.use("/api" , apiRouter)

app.get("/" , (req,res) => {

    return res.json({
        status : true,
        message : "OK"
    })
})

app.use(errHandler)

app.listen(config.server.PORT, () => {
    console.log("Server is runnig on port " + config.server.PORT)
})