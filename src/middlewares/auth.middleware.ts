import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { ResponseFactory } from "../utils/response-factory";

import * as jwt from "jsonwebtoken";

export default async function authMiddleware(ctx: Context, next: Next) {
  const token = getCookie(ctx, "auth-token");
  if (!token) return ResponseFactory.unauthorized(ctx);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN!) as {
      userId: string;
    };

    ctx.set("userId", decoded.userId);
    await next();
  } catch (err) {
    return ResponseFactory.notFound(
      ctx,
      "Невалидный токен. Перезайдите в приложение",
    );
  }
}
