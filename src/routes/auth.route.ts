import { Hono } from "hono";
import { hash, verify } from "argon2";
import z from "zod";

import * as jwt from "jsonwebtoken";

import { validator } from "../lib/validator";
import { prisma } from "../lib/prisma";
import { ResponseFactory } from "../utils/response-factory";
import { deleteCookie, setCookie } from "hono/cookie";

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

    const token = await jwt.sign(
      {
        userId: isExistUser.id,
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

    const hashedPassword = await hash(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return ResponseFactory.success(ctx, user);
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
