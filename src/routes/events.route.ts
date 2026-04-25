import { Hono } from "hono";

import { ResponseFactory } from "../utils/response-factory";

import { prisma } from "../lib/prisma";
import { validator } from "../lib/validator";

import { checkResourceOwnership } from "../middlewares/owner-check";
import auth from "../middlewares/auth.middleware";

import {
  eventCreateSchema,
  eventFiltersSchema,
  eventUpdateSchema,
} from "../schemas/events";

export const events = new Hono();

events.get("/", validator("query", eventFiltersSchema), async (ctx) => {
  const { page, limit, category, price, age, search, date } =
    ctx.req.valid("query");

  const events = await prisma.event.findMany({
    where: {
      price,
      ...(category && { categories: { has: category } }),
      ...(date && { date }),
      ...(age && {
        AND: {
          minAge: { lte: age },
          maxAge: { gte: age },
        },
      }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return ResponseFactory.success(ctx, events);
});

events.post("/", auth(), validator("json", eventCreateSchema), async (ctx) => {
  const ownerId = ctx.get("userId");
  const eventData = ctx.req.valid("json");

  const event = await prisma.event.create({
    data: {
      ...eventData,
      latitude: 0,
      longitude: 0,
      ownerId: ownerId,
    },
  });

  return ResponseFactory.success(ctx, { message: "Мероприятие успешно создано" });
});

events.get("/my", auth(), async (ctx) => {
  const userId = ctx.get("userId");
  const events = await prisma.event.findMany({ where: { ownerId: userId } });

  return ResponseFactory.success(ctx, events);
});

events.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");

  const event = await prisma.event.findUnique({ where: { id } });

  if (!event)
    return ResponseFactory.notFound(ctx, "Мероприятие с таким ID не найдено");

  return ResponseFactory.success(ctx, event);
});

events.patch(
  "/:id",
  auth(),
  validator("json", eventUpdateSchema),
  async (ctx) => {
    const id = ctx.req.param("id");
    const eventData = ctx.req.valid("json");

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...eventData,
        latitude: 0,
        longitude: 0,
      },
    });

    return ResponseFactory.success(ctx, { message: "Мероприятие успешно обновлено" });
  },
);

events.delete(
  "/:id",
  auth(),
  checkResourceOwnership(async (ctx) => {
    const event = await prisma.event.findUnique({
      where: { id: ctx.req.param("id") },
      select: { ownerId: true },
    });

    return event?.ownerId;
  }),
  async (ctx) => {
    const id = ctx.req.param("id");

    const event = await prisma.event.delete({ where: { id } });

    if (!event)
      return ResponseFactory.notFound(ctx, "Мероприятие с таким ID не найдено");

    return ResponseFactory.success(ctx, { message: "Мероприятие успешно удалено" });
  },
);
