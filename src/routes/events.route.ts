import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { ResponseFactory } from "../utils/response-factory";
import { validator } from "../lib/validator";
import z from "zod";

export const events = new Hono();

events.get(
  "/",
  validator(
    "query",
    z.object({
      name: z
        .string("Name is required")
        .min(3, "Name must be at least 3 characters"),
    }),
  ),
  async (ctx) => {
    const events = await prisma.event.findMany();

    return ResponseFactory.success(ctx, events);
  },
);

events.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");

  const event = await prisma.event.findUnique({ where: { id } });

  if (!event)
    return ResponseFactory.notFound(ctx, "Event with such id is not found.");

  return ResponseFactory.success(ctx, event);
});
