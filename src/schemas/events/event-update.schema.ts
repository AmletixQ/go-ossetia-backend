import z from "zod";
import { EventCategory } from "../../generated/prisma/enums";

export const eventUpdateSchema = z
  .object({
    name: z.string().min(4).max(50).optional(),
    description: z.string().min(10).max(500).optional(),

    address: z.string().min(2).max(100).optional(),
    price: z.number().min(0).optional(),
    date: z.iso.datetime().optional(),

    minAge: z.number().min(0).optional(),
    maxAge: z.number().min(0).optional(),

    categories: z.enum(EventCategory).array().optional(),

    blocks: z
      .array(
        z.object({
          title: z.string().min(2).max(100).optional(),
          content: z.string().min(10).max(1000).optional(),
        }),
      )
      .min(1)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.minAge && data.maxAge && data.minAge > data.maxAge) {
        return false;
      }
      return true;
    },
    {
      message: "Минимальный возраст не может быть больше максимального",
      path: ["minAge"],
    },
  );
