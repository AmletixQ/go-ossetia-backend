import { createTransport, type SendMailOptions } from "nodemailer";

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
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Подтверждение email адреса</h2>
      <p>Здравствуйте!</p>
      <p>Ваш код подтверждения:</p>
      <h1 style="letter-spacing: 8px; font-size: 42px; color: #2563eb;">${otp}</h1>
      <p><strong>Код действителен 10 минут.</strong></p>
      <p>Если вы не запрашивали этот код — просто проигнорируйте письмо.</p>
      <hr>
    </div>
  `;

  await sendEmail({
    to,
    subject: `Ваш код подтверждения - ${otp}`,
    text: `Ваш код подтверждения: ${otp}. Действует 10 минут.`,
    html: htmlTemplate,
  });
}
