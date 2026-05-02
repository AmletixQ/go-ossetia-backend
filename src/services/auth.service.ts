import { hash } from "argon2";
import { verify } from "jsonwebtoken";

import { prisma } from "../lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";

import generateOTP from "../utils/generate-otp";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../utils/http-errors";

import { AUTH_CONFIG } from "../configs";

import { User } from "../generated/prisma/client";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface VerifyEmailData {
  email: string;
  code: string;
}

interface ResendVerificationCodeData {
  email: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

interface AuthService {
  register(data: RegisterData): Promise<User>;
  login(data: LoginData): Promise<User>;

  verifyEmail(data: VerifyEmailData): Promise<boolean>;
  resendVerificationCode(data: ResendVerificationCodeData): Promise<boolean>;

  forgotPassword(data: ForgotPasswordData): Promise<boolean>;
  resetPassword(data: ResetPasswordData): Promise<boolean>;
}

export const authService: AuthService = {
  async register({ email, password, firstName, lastName }) {
    const isExistUser = await prisma.user.findUnique({ where: { email } });

    if (isExistUser)
      throw new ConflictError(
        "Пользователь с таким email-адресом уже существует",
      );

    const otp = generateOTP(6);
    const hashedPassword = await hash(password);
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP.EXPIRES_MINUTES);

    try {
      await sendVerificationEmail(email, otp);
    } catch (err) {
      console.error("Ошибка отправки email:", err);

      throw new InternalServerError(
        "Пользователь создан, но не удалось отправить email с подтверждением. Попробуйте позже.",
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      await tx.token.delete({
        where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
      });

      await tx.token.create({
        data: {
          email,
          token: otp,
          expiresAt,
          type: "EMAIL_VERIFICATION",
        },
      });

      return newUser;
    });

    return user;
  },
  async login(data) {
    const { email, password } = data;

    const isExistUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!isExistUser)
      throw new NotFoundError("Пользователь с таким email-адресом не найден");

    const isValidPassword = await verify(isExistUser.password, password);

    if (!isValidPassword) throw new UnauthorizedError("Неверный пароль");

    return isExistUser;
  },
  async verifyEmail({ email, code }) {
    const isVerifyTokenExists = await prisma.token.findUnique({
      where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
    });

    if (!isVerifyTokenExists)
      throw new NotFoundError("Код для верификации не найден");

    if (new Date() > isVerifyTokenExists.expiresAt) {
      await prisma.token.delete({
        where: {
          email_type: {
            email,
            type: "EMAIL_VERIFICATION",
          },
        },
      });
      throw new UnauthorizedError("Код для верификации устарел");
    }

    if (isVerifyTokenExists.token !== code)
      throw new UnauthorizedError("Неправильный код верификации");

    await prisma.$transaction(async (tx) => {
      await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });

      await prisma.token.delete({
        where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
      });
    });

    return true;
  },
  async resendVerificationCode(data) {
    const { email } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      throw new NotFoundError("Пользователь с таким email не существует");

    if (user.isEmailVerified)
      throw new BadRequestError("Email уже подтвержден");

    let existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
    });

    const now = new Date();

    if (
      existingToken &&
      existingToken.attempts >= AUTH_CONFIG.OTP.MAX_ATTEMPTS
    ) {
      const hoursSinceLastSent =
        now.getTime() - existingToken.lastSentAt.getTime() / (1000 * 60 * 60);

      if (hoursSinceLastSent < AUTH_CONFIG.OTP.RESET_AFTER_HOURS)
        throw new TooManyRequestsError(
          "Превышено количество попыток. Попробуйте позже.",
        );

      existingToken = await prisma.token.update({
        where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
        data: {
          attempts: 0,
        },
      });
    }

    if (existingToken?.lastSentAt) {
      const secondPassed =
        (now.getTime() - existingToken.lastSentAt.getTime()) / 1000;

      if (secondPassed < AUTH_CONFIG.OTP.COOLDOWN_SECONDS) {
        const secondLeft = Math.ceil(
          AUTH_CONFIG.OTP.COOLDOWN_SECONDS - secondPassed,
        );

        throw new TooManyRequestsError(
          `Повторная отправка возможна через ${secondLeft} секунд`,
        );
      }
    }

    const otp = generateOTP(6);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    try {
      await sendVerificationEmail(email, otp);
    } catch (err) {
      console.error("Ошибка отправки email:", err);

      throw new InternalServerError(
        "Не удалось отправить email с кодом подтверждения. Попробуйте позже.",
      );
    }

    await prisma.token.upsert({
      where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
      update: {
        token: otp,
        expiresAt,
        lastSentAt: now,
        attempts: { increment: 1 },
      },
      create: {
        email,
        type: "EMAIL_VERIFICATION",
        token: otp,
        expiresAt,
      },
    });

    return true;
  },
  async forgotPassword(data) {
    const { email } = data;

    const now = new Date();

    let existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
    });

    if (
      existingToken &&
      existingToken.attempts >= AUTH_CONFIG.OTP.MAX_ATTEMPTS
    ) {
      const hoursSinceLastSent =
        (now.getTime() - existingToken.lastSentAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastSent < AUTH_CONFIG.OTP.RESET_AFTER_HOURS)
        throw new TooManyRequestsError(
          "Превышено количество попыток. Попробуйте позже.",
        );

      existingToken = await prisma.token.update({
        where: { email_type: { email, type: "PASSWORD_RESET" } },
        data: {
          attempts: 0,
        },
      });
    }

    if (existingToken?.lastSentAt) {
      const secondPassed =
        (now.getTime() - existingToken.lastSentAt.getTime()) / 1000;

      if (secondPassed < AUTH_CONFIG.OTP.COOLDOWN_SECONDS) {
        const secondLeft = Math.ceil(
          AUTH_CONFIG.OTP.COOLDOWN_SECONDS - secondPassed,
        );

        throw new TooManyRequestsError(
          `Повторная отправка возможна через ${secondLeft} секунд`,
        );
      }
    }

    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await sendPasswordResetEmail(email, otp);
    } catch (err) {
      console.error("Ошибка отправки письма сброса пароля:", err);
      throw new InternalServerError(
        "Не удалось отправить письмо. Попробуйте позже.",
      );
    }

    await prisma.token.upsert({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
      update: {
        attempts: { increment: 1 },
        lastSentAt: now,
        token: otp,
        expiresAt,
      },
      create: {
        email,
        type: "PASSWORD_RESET",
        token: otp,
        expiresAt,
      },
    });

    return true;
  },
  async resetPassword(data) {
    const { email, code, newPassword } = data;
    const existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
    });

    if (!existingToken)
      throw new UnauthorizedError(
        "Неверный или истекший код для сброса пароля",
      );

    if (existingToken.expiresAt < new Date()) {
      await prisma.token.delete({
        where: { email_type: { email, type: "PASSWORD_RESET" } },
      });
      throw new UnauthorizedError("Код для сброса пароля истек");
    }

    if (existingToken.token !== code)
      throw new UnauthorizedError("Неверный код подтверждения");

    const hashedPassword = await hash(newPassword);

    await prisma.$transaction(async (ctx) => {
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
        },
      });

      await prisma.token.delete({
        where: { email_type: { email, type: "PASSWORD_RESET" } },
      });
    });

    return true;
  },
};
