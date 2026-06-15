import { Hono } from "hono";
import z from "zod";
import { deleteCookie, setCookie } from "hono/cookie";

import jwt from "jsonwebtoken";

import { validator } from "../lib";
import { ResponseFactory } from "../utils";
import { authService } from "../services";

import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth";

export const auth = new Hono();

auth.post("/login", validator("json", loginSchema), async (ctx) => {
  const { email, password } = ctx.req.valid("json");
  const user = await authService.login({ email, password });

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
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

  const response = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,

    isEmailVerified: user.isEmailVerified,
  };

  return ResponseFactory.success(ctx, response);
});

auth.post("/register", validator("json", registerSchema), async (ctx) => {
  const data = ctx.req.valid("json");
  const user = await authService.register(data);

  return ResponseFactory.success(ctx, {
    message:
      "Пользователь зарегистрирован. Проверьте почту и введите код подтверждения.",
    userId: user.id,
    email: user.email,
  });
});

auth.post(
  "/verify-email",
  validator("json", verifyEmailSchema),
  async (ctx) => {
    const { email, code } = ctx.req.valid("json");

    await authService.verifyEmail({ email, code });

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

    await authService.resendVerificationCode({ email });

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

    await authService.forgotPassword({ email });

    return ResponseFactory.success(ctx, {
      message: "Инструкции по сбросу пароля отправлены на вашу почту",
    });
  },
);

auth.post(
  "/reset-password",
  validator("json", resetPasswordSchema),
  async (ctx) => {
    const data = ctx.req.valid("json");

    await authService.resetPassword(data);

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
