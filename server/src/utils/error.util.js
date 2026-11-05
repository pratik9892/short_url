import { StatusCodes } from "http-status-codes";
import { baseError } from "../errors/baseError.js";


export function errHandler(err,req,res,next){
    // pino-http adds res.err (with its stack) to this request's log line; 4xx stay a one-line warning
    if(!(err instanceof baseError) || err.statuscode >= 500){
        res.err = err
    }

    if(err instanceof baseError){
        return res.status(err.statuscode).json({
            success : false,
            message : err.message,
            error : err.details,
            data : {}
        })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success : false,
        message : "Something Went Wrong",
        error : err,
        data : {}
    })
}