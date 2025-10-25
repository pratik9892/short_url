import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError";

class badRequest extends baseError {
    constructor(propertyName,details){
        super("Bad Request Error",`Bad Request : ${propertyName}`,StatusCodes.BAD_REQUEST,details)
    }
}

export {badRequest}