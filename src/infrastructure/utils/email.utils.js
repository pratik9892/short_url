import sgMail from "@sendgrid/mail"
import { config } from "../../config/server.config.js"
import {ConflictError} from "../../errors/conflictError.js"

if(config.email.SENDGRID_APIKEY){
    sgMail.setApiKey(config.email.SENDGRID_APIKEY)
} else {
    console.log("sendgrid api key missing")
}


export async function sendWelcomeEmail(email,username){
    const senderEmail = config.email.SENDGRID_SENDER_EMAIL || "test@example.com";

     if (senderEmail === 'test@example.com') {
        console.warn(`[SendGrid WARN] Using placeholder sender email. Check 'SENDER_EMAIL' in config.`);
    }

    const message = {
        to: email,
        from: senderEmail,
        subject: `Welcome to the App, ${username}! Your Account is Ready.`,
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

            console.log(`Email sent successfully to ${email} with username : ${username}.Status : ${response.statusCode}`);
            return 'EmailSent'
            
    } catch (error) {
        console.log(error);
        throw new ConflictError("Email not send")
    }
}