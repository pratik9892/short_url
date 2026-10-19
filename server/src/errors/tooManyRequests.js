import { StatusCodes } from "http-status-codes";
import { baseError } from "./baseError.js";

class tooManyRequests extends baseError {
  constructor(details = "Rate limit exceeded. Try again later.") {
    super(
      "Too Many Requests",
      "Too many requests",
      StatusCodes.TOO_MANY_REQUESTS,
      details
    );
  }
}

export { tooManyRequests };
