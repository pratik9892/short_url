import sgMail from "@sendgrid/mail"
import { config } from "../../config/server.config.js"
import {ConflictError} from "../../errors/conflictError.js"
import { configDotenv } from "dotenv"
import { logger } from "../logger/logger.js"

configDotenv()

if(config.email.SENDGRID_APIKEY){
    sgMail.setApiKey(config.email.SENDGRID_APIKEY)
} else {
    logger.warn("SENDGRID_API_KEY missing; welcome emails will fail")
}


export async function sendWelcomeEmail(email,username){
    const senderEmail = config.email.SENDGRID_SENDER_EMAIL || "test@example.com";

     if (senderEmail === 'test@example.com') {
        logger.warn("SENDER_EMAIL not set; using placeholder sender");
    }

    const message = {
        to: email,
        from: senderEmail,
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
    

    try {
            const [response] = await sgMail.send(message);

            logger.info({ statusCode: response.statusCode }, "welcome email sent");
            return 'EmailSent'
            
    } catch (error) {
        logger.error({ statusCode: error?.code, errors: error?.response?.body?.errors }, "SendGrid send failed");
        throw new ConflictError("Email not send")
    }
}