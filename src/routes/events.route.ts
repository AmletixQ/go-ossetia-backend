import { Hono } from "hono";

import { ResponseFactory } from "../utils";
import { prisma, validator } from "../lib";
import { eventService } from "../services";
import { auth, checkResourceOwnership } from "../middlewares";

import {
  eventCreateSchema,
  eventFiltersSchema,
  eventUpdateSchema,
} from "../schemas/events";

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

events.post("/:id/favourite", auth(), async (ctx) => {
  const userId = ctx.get("userId");
  const eventId = ctx.req.param("id");

  await eventService.favoriteEvent(eventId!, userId);

  return ResponseFactory.success(ctx, {
    message: "Мероприятие добавлено в избранное",
  });
});

events.post("/:id/unfavourite", auth(), async (ctx) => {
  const userId = ctx.get("userId");
  const eventId = ctx.req.param("id");

  await eventService.unfavoriteEvent(eventId!, userId);

  return ResponseFactory.success(ctx, {
    message: "Мероприятие удалено из избранного",
  });
});

events.post("/:id/follow");
events.post("/:id/unfollow");
