import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/server.config.js";
import { UnauthorizedError } from "../../errors/unauthorizedError.js";
import { logger } from "../../infrastructure/logger/logger.js";

const client = new OAuth2Client(config.google.CLIENT_ID);

/**
 * Verify a Google Identity Services ID token from the frontend.
 * @param {string} credential JWT from Google One Tap / GIS button
 */
export async function verifyGoogleIdToken(credential) {
  if (!config.google.CLIENT_ID) {
    throw new UnauthorizedError(
      "Google login is not configured (missing GOOGLE_CLIENT_ID)"
    );
  }

  if (!credential) {
    throw new UnauthorizedError("Google credential is required");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.google.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      throw new UnauthorizedError("Invalid Google token");
    }

    if (payload.email_verified === false) {
      throw new UnauthorizedError("Google email is not verified");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email?.split("@")[0] || "Google User",
      avatar: payload.picture || null,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    logger.warn(
      { reason: String(error?.message || error).replace(/[\w-]+\.[\w-]+\.[\w-]+/g, "[token]") },
      "Google token verification failed"
    );
    throw new UnauthorizedError("Invalid or expired Google token");
  }
}
