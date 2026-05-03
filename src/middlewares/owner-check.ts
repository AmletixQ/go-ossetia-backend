import { Context, Next } from "hono";
import { Role } from "../generated/prisma/enums";

import { ResponseFactory } from "../utils";

export function checkResourceOwnership(
  getResourceOwnerId: (ctx: Context) => Promise<string | undefined> | string,
) {
  return async (ctx: Context, next: Next) => {
    const userId = ctx.get("userId");
    const userRole = ctx.get("userRole") as Role;
    const resourceOwnerId = await getResourceOwnerId(ctx);

    if (userRole === "ADMIN" || userId === resourceOwnerId) {
      return await next();
    }

    return ResponseFactory.forbidden(
      ctx,
      "Доступ запрещен: вы не являетесь владельцем этого ресурса",
    );
  };
}
