import { z } from "zod";

export const createLinkBodySchema = z
  .object({
    longUrl: z
      .string({ required_error: "longUrl is required" })
      .trim()
      .url("Invalid URL")
      .refine(
        (value) => {
          try {
            const protocol = new URL(value).protocol;
            return protocol === "http:" || protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "longUrl must use http or https" }
      ),
    linkName: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z
        .string()
        .trim()
        .min(1, "linkName cannot be empty")
        .max(20, "linkName must be at most 20 characters")
        .optional()
    ),
  })
  .strict();
