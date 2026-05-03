import { AUTH_CONFIG } from "../configs";
import { TokenType } from "../generated/prisma/enums";

import { prisma, sendPasswordResetEmail, sendVerificationEmail } from "../lib";

import {
  generateOTP,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../utils";

interface TokenService {
  generateOrRefreshTokenAndSendEmail(
    email: string,
    type: TokenType,
  ): Promise<{ otp: string; message: string }>;
  verifyAndConsume(email: string, code: string, type: TokenType): Promise<void>;
  deleteByType(email: string, type: TokenType): Promise<void>;
}

export const tokenService: TokenService = {
  async generateOrRefreshTokenAndSendEmail(email, type) {
    const now = new Date();

    let existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type } },
    });

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
        where: { email_type: { email, type } },
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
    const expiresAt = new Date(now.getTime() + AUTH_CONFIG.OTP.EXPIRES_MINUTES);

    if (type === "EMAIL_VERIFICATION") {
      await sendVerificationEmail(email, otp);
    } else if (type === "PASSWORD_RESET") {
      await sendPasswordResetEmail(email, otp);
    } else {
      throw new NotFoundError(`Неизвестный тип токена: ${type}`);
    }

    await prisma.token.upsert({
      where: { email_type: { email, type } },
      update: {
        token: otp,
        expiresAt,
        lastSentAt: now,
        attempts: { increment: 1 },
      },
      create: {
        email,
        type,
        token: otp,
        expiresAt,
      },
    });

    return { otp, message: "Код подтверждения отправлен на email" };
  },

  async verifyAndConsume(email, code, type) {
    const token = await prisma.token.findUnique({
      where: { email_type: { email, type } },
    });

    if (!token) throw new NotFoundError("Код не найден");
    if (token.expiresAt < new Date()) {
      await prisma.token.delete({ where: { email_type: { email, type } } });
      throw new UnauthorizedError("Код истек");
    }
    if (token.token !== code) throw new UnauthorizedError("Неверный код");

    await prisma.token.delete({ where: { email_type: { email, type } } });
  },

  async deleteByType(email, type) {
    await prisma.token.deleteMany({
      where: { email, type },
    });
  },
};
