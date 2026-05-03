import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import * as jwt from "jsonwebtoken";

import { ResponseFactory } from "../utils";

import { Role } from "../generated/prisma/enums";
import { AppVariables } from "../types/hono";

export default function auth(allowedRoles?: Role | Role[]) {
  return async (ctx: Context<{ Variables: AppVariables }>, next: Next) => {
    const token = getCookie(ctx, "auth-token");
    if (!token) return ResponseFactory.unauthorized(ctx);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN!) as {
        userId: string;
        role: Role;
      };

      ctx.set("userId", decoded.userId);
      ctx.set("userRole", decoded.role);

      if (allowedRoles) {
        const roles = Array.isArray(allowedRoles)
          ? allowedRoles
          : [allowedRoles];

        if (!roles.includes(decoded.role)) {
          return ResponseFactory.forbidden(
            ctx,
            "Недостаточно прав для доступа",
          );
        }
      }

      await next();
    } catch (err) {
      return ResponseFactory.notFound(
        ctx,
        "Невалидный токен. Перезайдите в приложение",
      );
    }
  };
}
