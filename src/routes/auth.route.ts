import { Hono } from "hono";
import z from "zod";
import { deleteCookie, setCookie } from "hono/cookie";

import * as jwt from "jsonwebtoken";

import { validator } from "../lib/validator";

import { ResponseFactory } from "../utils/response-factory";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../utils/http-errors";

import { authService } from "../services/auth.service";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth";

export const auth = new Hono();

auth.post("/login", validator("json", loginSchema), async (ctx) => {
  try {
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
    };

    return ResponseFactory.success(ctx, response);
  } catch (err: any) {
    if (err instanceof UnauthorizedError)
      return ResponseFactory.unauthorized(ctx, err.message);

    if (err instanceof NotFoundError)
      return ResponseFactory.notFound(ctx, err.message);

    return ResponseFactory.internal(ctx, err.message);
  }
});

auth.post("/register", validator("json", registerSchema), async (ctx) => {
  try {
    const data = ctx.req.valid("json");
    const user = await authService.register(data);

    return ResponseFactory.success(ctx, {
      message:
        "Пользователь зарегистрирован. Проверьте почту и введите код подтверждения.",
      userId: user.id,
      email: user.email,
    });
  } catch (err: any) {
    if (err instanceof ConflictError)
      return ResponseFactory.badRequest(ctx, err.message);

    return ResponseFactory.internal(ctx, err.message);
  }
});

auth.post(
  "/verify-email",
  validator("json", verifyEmailSchema),
  async (ctx) => {
    try {
      const { email, code } = ctx.req.valid("json");

      await authService.verifyEmail({ email, code });

      return ResponseFactory.success(ctx, {
        message: "Email-адрес успешно подтвержден",
      });
    } catch (err: any) {
      if (err instanceof NotFoundError)
        return ResponseFactory.notFound(ctx, err.message);

      if (err instanceof UnauthorizedError)
        return ResponseFactory.unauthorized(ctx, err.message);

      return ResponseFactory.internal(ctx, err.message);
    }
  },
);

auth.post(
  "/resend-verification-code",
  validator("json", z.object({ email: z.email("Некорректный формат email") })),
  async (ctx) => {
    try {
      const { email } = ctx.req.valid("json");

      await authService.resendVerificationCode({ email });

      return ResponseFactory.success(ctx, {
        message: "Новый код подтверждения отправлен на вашу почту",
      });
    } catch (err: any) {
      if (err instanceof NotFoundError)
        return ResponseFactory.notFound(ctx, err.message);

      if (err instanceof BadRequestError)
        return ResponseFactory.badRequest(ctx, err.message);

      if (err instanceof TooManyRequestsError)
        return ResponseFactory.tooManyRequests(ctx, err.message);

      return ResponseFactory.internal(ctx, err.message);
    }
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
    try {
      const { email } = ctx.req.valid("json");

      await authService.forgotPassword({ email });

      return ResponseFactory.success(ctx, {
        message: "Инструкции по сбросу пароля отправлены на вашу почту",
      });
    } catch (err: any) {
      if (err instanceof TooManyRequestsError)
        return ResponseFactory.tooManyRequests(ctx, err.message);

      return ResponseFactory.internal(ctx, err.message);
    }
  },
);

auth.post(
  "/reset-password",
  validator("json", resetPasswordSchema),
  async (ctx) => {
    try {
      const data = ctx.req.valid("json");

      await authService.resetPassword(data);

      return ResponseFactory.success(ctx, {
        message: "Пароль успешно изменен",
      });
    } catch (err: any) {
      if (err instanceof UnauthorizedError)
        return ResponseFactory.unauthorized(ctx, err.message);

      return ResponseFactory.internal(ctx, err.message);
    }
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
