import { Hono } from "hono";
import { prisma } from "../lib/prisma";

export const events = new Hono();

events.get("/", async (ctx) => {
  const res = await prisma.event.findMany();

  return ctx.json({ events: res });
});

events.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");

  const event = await prisma.event.findUnique({ where: { id } });

  if (!event)
    return ctx.json({
      status: 404,
      message: "Event with such id is not found.",
    });

  return ctx.json({ status: 200, event });
});
