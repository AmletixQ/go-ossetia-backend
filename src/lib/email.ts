import { createTransport, type SendMailOptions } from "nodemailer";
import { EMAIL_TEMPLATES } from "../configs";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("SMTP соединение успешно проверено");
    return true;
  } catch (err) {
    console.error("Ошибка подключения к SMTP:", err);
    return false;
  }
}

export async function sendEmail(options: EmailOptions) {
  const mailOptions: SendMailOptions = {
    from: process.env.SMTP_FROM || "",
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email отправлен: ${info.messageId}`);
  } catch (error) {
    console.error("Ошибка при отправке email:", error);
    throw error;
  }
}

export async function sendVerificationEmail(to: string, otp: string) {
  await sendEmail({
    to,
    subject: `Ваш код подтверждения - ${otp}`,
    text: `Ваш код подтверждения: ${otp}. Действует 10 минут.`,
    html: EMAIL_TEMPLATES.EMAIL_VERIFICATION(otp),
  });
}

export async function sendPasswordResetEmail(to: string, otp: string) {
  await sendEmail({
    to,
    subject: `Код для сброса пароля — ${otp}`,
    text: `Ваш код для сброса пароля: ${otp}. Действует 10 минут.`,
    html: EMAIL_TEMPLATES.PASSWORD_RESET(otp),
  });
}
