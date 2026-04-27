import { Hono } from "hono";
import { hash, verify } from "argon2";
import z from "zod";
import { deleteCookie, setCookie } from "hono/cookie";

import * as jwt from "jsonwebtoken";

import { validator } from "../lib/validator";
import { prisma } from "../lib/prisma";
import { sendVerificationEmail } from "../lib/email";

import { ResponseFactory } from "../utils/response-factory";
import generateOTP from "../utils/generate-otp";

export const auth = new Hono();

auth.post(
  "/login",
  validator(
    "json",
    z.object({
      email: z.email("Email property is a required"),
      password: z
        .string("Password property is a required")
        .min(8, "Password must be a least 8 characters"),
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
        "User with such email is not a found",
      );

    const isValidPassword = await verify(isExistUser.password, password);

    if (!isValidPassword)
      return ResponseFactory.unauthorized(ctx, "Wrong password");

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
      email: z.email("Email-адрес является обязательным"),
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      await tx.verificationToken.deleteMany({ where: { email } });

      await tx.verificationToken.create({
        data: {
          email,
          token: otp,
          expiresAt,
        },
      });

      return newUser;
    });

    try {
      await sendVerificationEmail(email, otp);
    } catch (err) {
      console.error("Ошибка отправки email:", err);

      return ResponseFactory.internal(
        ctx,
        "Пользователь создан, но не удалось отправить email с подтверждением. Попробуйте позже.",
      );
    }

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
      email: z.email("Email-почта является обязательной"),
      code: z
        .string("Код верификации является обязательным")
        .length(6, "Код верификации должен содержать 6 символов"),
    }),
  ),
  async (ctx) => {
    const { email, code } = ctx.req.valid("json");

    const isVerifyTokenExists = await prisma.verificationToken.findUnique({
      where: { email },
    });

    if (!isVerifyTokenExists)
      return ResponseFactory.notFound(ctx, "Код для верификации не найден");

    if (new Date() > isVerifyTokenExists.expiresAt) {
      await prisma.verificationToken.delete({
        where: { email },
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

      await prisma.verificationToken.delete({
        where: { email },
      });
    });

    return ResponseFactory.success(ctx, {
      message: "Email-почта успешно подтверждена",
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
