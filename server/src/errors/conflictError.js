import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError.js";

class ConflictError extends baseError{
    constructor(description="resource already exists or conflicts with current state"){
        super("Conflict Error",description,StatusCodes.CONFLICT,{})
    }
}

export {ConflictError}