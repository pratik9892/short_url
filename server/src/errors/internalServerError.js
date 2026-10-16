import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError.js";

class InternalServerError extends baseError {
    constructor(details){
        super("Internal Server Error",`Something went wrong!!!`,StatusCodes.INTERNAL_SERVER_ERROR,details)
    }
}

export {InternalServerError}