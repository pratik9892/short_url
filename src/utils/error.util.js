import { StatusCodes } from "http-status-codes";
import { baseError } from "../errors/baseError.js";


export function errHandler(err,req,res,next){
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