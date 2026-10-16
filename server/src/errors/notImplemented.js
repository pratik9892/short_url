import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError.js";

class NotImplemented extends baseError {
    constructor(methodName){
        super("NotImplemented Error",`Not Implemented ${methodName}`,StatusCodes.NOT_IMPLEMENTED,{})
    }
}

export {NotImplemented}