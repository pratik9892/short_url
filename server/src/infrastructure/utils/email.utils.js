import { config } from "../../config/server.config.js"
import {ConflictError} from "../../errors/conflictError.js"
import { logger } from "../logger/logger.js"

const RESEND_URL = "https://api.resend.com/emails"

// Resend's shared test sender: only delivers to the Resend account's own email.
// Set RESEND_FROM_EMAIL to an address on a verified domain to email real users.
const DEFAULT_FROM = "Shortly <onboarding@resend.dev>"

if(!config.email.RESEND_API_KEY){
    logger.warn("RESEND_API_KEY missing; welcome emails will fail")
}


export async function sendWelcomeEmail(email,username){
    const message = {
        to: [email],
        from: config.email.RESEND_FROM_EMAIL || DEFAULT_FROM,
        subject: `Welcome to the ShortURL App, ${username}! Your Account is Ready.`,
        text: `Hello ${username},\n\nThank you for signing up! We're excited to have you onboard.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4CAF50;">Welcome, ${username}!</h2>
                <p>Thank you for joining our platform. We're excited for you to get started.</p>
                <p>— The App Team</p>
            </div>
        `,
    };

    const response = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.email.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });

    const body = await response.json().catch(() => ({}));

    if(!response.ok){
        // body.name/message describe the failure (e.g. validation_error); the recipient stays out of the log
        logger.error({ statusCode: response.status, error: body.name, reason: body.message }, "Resend send failed");
        throw new ConflictError("Email not send")
    }

    logger.info({ statusCode: response.status, emailId: body.id }, "welcome email sent");
    return 'EmailSent'
}
