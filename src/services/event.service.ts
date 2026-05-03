import z from "zod";

import {
  eventCreateSchema,
  eventFiltersSchema,
  eventUpdateSchema,
} from "../schemas/events";

import { EventModel } from "../generated/prisma/models";

import { BadRequestError, InternalServerError } from "../utils";

import {
  AddressNotFoundError,
  geocodeAddress,
  GeocodeResult,
  prisma,
} from "../lib";

interface EventService {
  getEvents(): Promise<EventModel[]>;
  getFilteredEvents(
    filter: z.infer<typeof eventFiltersSchema>,
  ): Promise<EventModel[]>;
  createEvent(
    data: z.infer<typeof eventCreateSchema> & { ownerId: string },
  ): Promise<EventModel>;
  getEventById(id: string): Promise<EventModel | null>;
  updateEvent(
    id: string,
    data: z.infer<typeof eventUpdateSchema>,
  ): Promise<EventModel | null>;
  deleteEvent(id: string): Promise<boolean>;
}
export const eventService: EventService = {
  getEvents: async () => await prisma.event.findMany(),

  async createEvent(data) {
    let geocodeResult: GeocodeResult;

    try {
      geocodeResult = await geocodeAddress(data.address);
    } catch (err: any) {
      if (err instanceof AddressNotFoundError)
        throw new BadRequestError(
          `Адрес "${data.address}" не найден. Пожалуйста, уточните адрес.`,
        );

      throw new InternalServerError(
        "Не удалось получить координаты по указанному адресу. Попробуйте позже.",
      );
    }

    return await prisma.event.create({
      data: {
        ...data,
        address: geocodeResult.formattedAddress,
        latitude: geocodeResult?.latitude || 0,
        longitude: geocodeResult?.longitude || 0,
        ownerId: data.ownerId,
      },
    });
  },

  async getEventById(id) {
    return await prisma.event.findUnique({
      where: { id },
    });
  },

  async updateEvent(id, data) {
    let geocodeResult: GeocodeResult | null = null;

    if (data.address?.trim()) {
      try {
        geocodeResult = await geocodeAddress(data.address);
      } catch (err) {
        if (err instanceof AddressNotFoundError)
          throw new BadRequestError(
            `Адрес "${data.address}" не найден. Пожалуйста, уточните адрес.`,
          );

        throw new InternalServerError(
          "Не удалось получить координаты по указанному адресу. Попробуйте позже.",
        );
      }
    }

    return await prisma.event.update({
      where: { id },
      data: {
        ...data,
        ...(data.address && {
          address: geocodeResult?.formattedAddress || data.address,
          latitude: geocodeResult?.latitude || 0,
          longitude: geocodeResult?.longitude || 0,
        }),
      },
    });
  },

  async deleteEvent(id) {
    const event = await prisma.event.delete({
      where: { id },
    });

    return !!event;
  },

  async getFilteredEvents(filter) {
    const { page, limit, category, price, age, search, date } = filter;

    return await prisma.event.findMany({
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
  },
};
