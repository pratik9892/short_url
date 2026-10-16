import { z } from "zod";

export const registerBodySchema = z
  .object({
    fullName: z
      .string({ required_error: "fullName is required" })
      .trim()
      .min(1, "fullName is required")
      .max(80, "fullName must be at most 80 characters"),
    username: z
      .string({ required_error: "username is required" })
      .trim()
      .toLowerCase()
      .min(3, "username must be at least 3 characters")
      .max(20, "username must be at most 20 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "username may only contain lowercase letters, numbers, and underscores"
      ),
    email: z
      .string({ required_error: "email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email"),
    password: z
      .string({ required_error: "password is required" })
      .min(8, "password must be at least 8 characters"),
  })
  .strict();

export const loginBodySchema = z
  .object({
    email: z
      .string({ required_error: "email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email"),
    password: z
      .string({ required_error: "password is required" })
      .min(1, "password is required"),
  })
  .strict();

export const googleBodySchema = z
  .object({
    credential: z
      .string({ required_error: "credential is required" })
      .trim()
      .min(1, "credential is required"),
  })
  .strict();
