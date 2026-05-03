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

import { eventService } from "../services/event.service";

export const events = new Hono();

events.get("/", validator("query", eventFiltersSchema), async (ctx) => {
  const filters = ctx.req.valid("query");

  const events = await eventService.getFilteredEvents(filters);

  return ResponseFactory.success(ctx, events);
});

events.post("/", auth(), validator("json", eventCreateSchema), async (ctx) => {
  const ownerId = ctx.get("userId");
  const eventData = ctx.req.valid("json");

  await eventService.createEvent({ ...eventData, ownerId });

  return ResponseFactory.success(ctx, {
    message: "Мероприятие успешно создано",
  });
});

events.get("/my", auth(), async (ctx) => {
  const userId = ctx.get("userId");
  const events = await prisma.event.findMany({ where: { ownerId: userId } });

  return ResponseFactory.success(ctx, events);
});

events.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");

  const event = await eventService.getEventById(id);

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

    await eventService.updateEvent(id, eventData);

    return ResponseFactory.success(ctx, {
      message: "Мероприятие успешно обновлено",
    });
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

    const event = await eventService.deleteEvent(id!);

    if (!event)
      return ResponseFactory.notFound(ctx, "Мероприятие с таким ID не найдено");

    return ResponseFactory.success(ctx, {
      message: "Мероприятие успешно удалено",
    });
  },
);
