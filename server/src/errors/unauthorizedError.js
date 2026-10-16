import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError.js";

class UnauthorizedError extends baseError{
    constructor(description="Authentication is required and has failed or not yet been provided"){
        super("Unauthorized Error",description,StatusCodes.UNAUTHORIZED,{})
    }
}

export {UnauthorizedError}