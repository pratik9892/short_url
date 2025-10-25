import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError";

class NotFound extends baseError {
    constructor(resourceName,resourceValue){
        super("NotFound Error",`Resource not found : ${resourceName} value : ${resourceValue}`,StatusCodes.NOT_FOUND,{
            resourceName,
            resourceValue
        })
    }
}

export {NotFound}