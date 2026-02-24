import nodemailer from "nodemailer";
import config from "../configuration/config.js";
import otpMailTemplate from "../middleware/mailTemplate/otpMailTemplate.js";

const sendOtp = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS,
        },
    });

    const html = otpMailTemplate(otp);

    const mailOptions = {
        from: config.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code - API.ai.com',
        html: html,
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`, // Fallback for plain text
    };

    await transporter.sendMail(mailOptions);
    return true;
};

export default sendOtp;