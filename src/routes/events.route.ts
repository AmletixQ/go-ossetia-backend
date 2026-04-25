import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { ResponseFactory } from "../utils/response-factory";

export const events = new Hono();

events.get("/", async (ctx) => {
  const events = await prisma.event.findMany();

  return ResponseFactory.success(ctx, events);
});

events.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");

  const event = await prisma.event.findUnique({ where: { id } });

  if (!event)
    return ResponseFactory.notFound(ctx, "Мероприятие с таким ID не найдено");

  return ResponseFactory.success(ctx, event);
});
