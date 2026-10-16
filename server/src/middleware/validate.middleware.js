import { badRequest } from "../errors/badRequest.js";

/**
 * Express middleware factory: validate req.body against a Zod schema.
 * On success, replaces req.body with the parsed (trimmed/coerced) value.
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const details = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.join(".") : "_form";
        // Keep the first message per field for a stable API contract
        if (!details[key]) {
          details[key] = issue.message;
        }
      }
      return next(new badRequest("Validation failed", details));
    }

    req.body = result.data;
    return next();
  };
}
