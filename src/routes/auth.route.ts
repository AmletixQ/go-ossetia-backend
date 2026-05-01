import { Hono } from "hono";
import { hash, verify } from "argon2";
import z from "zod";
import { deleteCookie, setCookie } from "hono/cookie";

import * as jwt from "jsonwebtoken";

import { validator } from "../lib/validator";
import { prisma } from "../lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";

import { ResponseFactory } from "../utils/response-factory";
import generateOTP from "../utils/generate-otp";
import {
  OTP_COOLDOWN_SECONDS,
  OTP_EXPIRES_MINUTES,
  OTP_MAX_ATTEMPTS,
  RESET_AFTER_HOURS,
} from "../contants";

export const auth = new Hono();

auth.post(
  "/login",
  validator(
    "json",
    z.object({
      email: z.email("Некорректный формат email-адреса"),
      password: z
        .string("Пароль является обязательным")
        .min(8, "Пароль должен содержать минимум 8 символов"),
    }),
  ),
  async (ctx) => {
    const { email, password } = ctx.req.valid("json");

    const isExistUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!isExistUser)
      return ResponseFactory.notFound(
        ctx,
        "Пользователь с таким email-адресом не найден",
      );

    const isValidPassword = await verify(isExistUser.password, password);

    if (!isValidPassword)
      return ResponseFactory.unauthorized(ctx, "Неверный пароль");

    const token = jwt.sign(
      {
        userId: isExistUser.id,
        role: isExistUser.role,
      },
      process.env.JWT_SECRET_TOKEN!,
      {
        expiresIn: "2h",
      },
    );

    setCookie(ctx, "auth-token", token, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 7200,
      path: "/",
    });

    const user = {
      id: isExistUser.id,
      email: isExistUser.email,
      firstName: isExistUser.firstName,
      lastName: isExistUser.lastName,
    };

    return ResponseFactory.success(ctx, user);
  },
);

auth.post(
  "/register",
  validator(
    "json",
    z.object({
      email: z.email("Некорректный формат email-адреса"),
      password: z
        .string("Пароль является обязательным")
        .min(8, "Пароль должен содержать больше 8 символов"),
      firstName: z
        .string("Имя является обязательным")
        .min(2, "Имя должно содержать больше 2 символов"),
      lastName: z
        .string("Фамилия является обязательной")
        .min(2, "Фамилия должна содержать больше 2 символов"),
    }),
  ),
  async (ctx) => {
    const { email, password, firstName, lastName } = ctx.req.valid("json");

    const isExistUser = await prisma.user.findUnique({ where: { email } });

    if (isExistUser)
      return ResponseFactory.conflict(
        ctx,
        "Пользователь с таким email-адресом уже существует",
      );

    const otp = generateOTP(6);
    const hashedPassword = await hash(password);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES);

    try {
      await sendVerificationEmail(email, otp);
    } catch (err) {
      console.error("Ошибка отправки email:", err);

      return ResponseFactory.internal(
        ctx,
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

      await tx.token.deleteMany({
        where: { email, type: "EMAIL_VERIFICATION" },
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

    return ResponseFactory.success(ctx, {
      message:
        "Пользователь зарегистрирован. Проверьте почту и введите код подтверждения.",
      userId: user.id,
      email: user.email,
    });
  },
);

auth.post(
  "/verify-email",
  validator(
    "json",
    z.object({
      email: z.email("Некорректный формат email-адреса"),
      code: z
        .string("Код верификации является обязательным")
        .length(6, "Код верификации должен содержать 6 символов"),
    }),
  ),
  async (ctx) => {
    const { email, code } = ctx.req.valid("json");

    const isVerifyTokenExists = await prisma.token.findUnique({
      where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
    });

    if (!isVerifyTokenExists)
      return ResponseFactory.notFound(ctx, "Код для верификации не найден");

    if (new Date() > isVerifyTokenExists.expiresAt) {
      await prisma.token.delete({
        where: {
          email_type: {
            email,
            type: "EMAIL_VERIFICATION",
          },
        },
      });
      return ResponseFactory.unauthorized(ctx, "Код для верификации устарел");
    }

    if (isVerifyTokenExists.token !== code)
      return ResponseFactory.unauthorized(ctx, "Неправильный код верификации");

    await prisma.$transaction(async (tx) => {
      await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });

      await prisma.token.delete({
        where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
      });
    });

    return ResponseFactory.success(ctx, {
      message: "Email-адрес успешно подтвержден",
    });
  },
);

auth.post(
  "/resend-verification-code",
  validator("json", z.object({ email: z.email("Некорректный формат email") })),
  async (ctx) => {
    const { email } = ctx.req.valid("json");

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return ResponseFactory.notFound(
        ctx,
        "Пользователь с таким email не существует",
      );

    if (user.isEmailVerified)
      return ResponseFactory.badRequest(ctx, "Email уже подтвержден");

    let existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "EMAIL_VERIFICATION" } },
    });

    const now = new Date();

    if (existingToken && existingToken.attempts >= OTP_MAX_ATTEMPTS) {
      const hoursSinceLastSent =
        now.getTime() - existingToken.lastSentAt.getTime() / (1000 * 60 * 60);

      if (hoursSinceLastSent < RESET_AFTER_HOURS)
        return ResponseFactory.tooManyRequests(
          ctx,
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

      if (secondPassed < OTP_COOLDOWN_SECONDS) {
        const secondLeft = Math.ceil(OTP_COOLDOWN_SECONDS - secondPassed);

        return ResponseFactory.tooManyRequests(
          ctx,
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

      return ResponseFactory.internal(
        ctx,
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

    return ResponseFactory.success(ctx, {
      message: "Новый код подтверждения отправлен на вашу почту",
    });
  },
);

auth.post(
  "/forgot-password",
  validator(
    "json",
    z.object({
      email: z.email("Некорректный формат email"),
    }),
  ),
  async (ctx) => {
    const { email } = ctx.req.valid("json");
    const now = new Date();

    let existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
    });

    if (existingToken && existingToken.attempts >= OTP_MAX_ATTEMPTS) {
      const hoursSinceLastSent =
        (now.getTime() - existingToken.lastSentAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastSent < RESET_AFTER_HOURS)
        return ResponseFactory.tooManyRequests(
          ctx,
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

      if (secondPassed < OTP_COOLDOWN_SECONDS) {
        const secondLeft = Math.ceil(OTP_COOLDOWN_SECONDS - secondPassed);

        return ResponseFactory.tooManyRequests(
          ctx,
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
      return ResponseFactory.internal(
        ctx,
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

    return ResponseFactory.success(ctx, {
      message: "Инструкции по сбросу пароля отправлены на вашу почту",
    });
  },
);

auth.post(
  "/reset-password",
  validator(
    "json",
    z
      .object({
        email: z.email("Некорректный формат email"),
        code: z
          .string("Код подтверждения должен состоять из 6 символов")
          .length(6, "Код подтверждения должен состоять из 6 символов"),
        newPassword: z
          .string("Пароль должен содержать минимум 6 символов")
          .min(6, "Пароль должен содержать минимум 6 символов"),
      })
      .refine((data) => Number.isInteger(+data.code), {
        message: "Код подтверждения должен состоять из 6 цифр",
        path: ["code"],
      }),
  ),
  async (ctx) => {
    const { email, code, newPassword } = ctx.req.valid("json");

    const existingToken = await prisma.token.findUnique({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
    });

    if (!existingToken)
      return ResponseFactory.unauthorized(
        ctx,
        "Неверный или истекший код для сброса пароля",
      );

    if (existingToken.expiresAt < new Date()) {
      await prisma.token.delete({
        where: { email_type: { email, type: "PASSWORD_RESET" } },
      });
      return ResponseFactory.unauthorized(ctx, "Код для сброса пароля истек");
    }

    if (existingToken.token !== code)
      return ResponseFactory.unauthorized(ctx, "Неверный код подтверждения");

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

    return ResponseFactory.success(ctx, {
      message: "Пароль успешно изменен",
    });
  },
);

auth.post("/logout", async (ctx) => {
  deleteCookie(ctx, "auth-token", {
    httpOnly: true,
    sameSite: "Strict",
    path: "/",
  });

  return ResponseFactory.success(ctx, {
    message: "Пользователь успешно вышел из системы",
  });
});
