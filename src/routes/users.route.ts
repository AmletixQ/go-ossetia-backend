import { Hono } from "hono";
import { ResponseFactory, ResponseFormats } from "../utils";
import { validator } from "../lib";
import { usersService } from "../services";
import { updateUserSchema } from "../schemas/users";
import { auth } from "../middlewares";

export const users = new Hono();

users.get("/", async (ctx) => {
  const users = await usersService.getAll();
  return ResponseFactory.success(ctx, users);
});

users.get("/followed-events", auth(), async (ctx) => {
  const userId = ctx.get("userId");

  const events = await usersService.getFollowedEvents(userId);
  return ResponseFactory.success(ctx, events);
});

users.get("/:id", async (ctx) => {
  const userId = ctx.req.param("id");

  const user = await usersService.getById(userId);
  const formattedUser = ResponseFormats.formatUserResponse(user!);

  return ResponseFactory.success(ctx, formattedUser);
});

users.patch("/", auth(), validator("json", updateUserSchema), async (ctx) => {
  const userId = ctx.get("userId");
  const userData = ctx.req.valid("json");

  const user = await usersService.update(userId, userData);
  const formattedUser = ResponseFormats.formatUserResponse(user);

  return ResponseFactory.success(ctx, formattedUser);
});

users.delete("/", auth(), async (ctx) => {
  const userId = ctx.get("userId");

  const user = await usersService.delete(userId);

  return ResponseFactory.success(ctx, ResponseFormats.formatUserResponse(user));
});
