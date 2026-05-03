import z from "zod";
import { EventCategory } from "../../generated/prisma/enums";

export const eventCreateSchema = z
  .object({
    name: z.string().min(4).max(50),
    description: z.string().min(10).max(500),

    address: z.string().min(2).max(100),
    price: z.number().min(0),
    date: z.iso.datetime(),

    minAge: z.number().min(0).optional(),
    maxAge: z.number().min(0).optional(),

    categories: z.enum(EventCategory).array(),

    blocks: z
      .array(
        z.object({
          title: z.string().min(2).max(100),
          content: z.string().min(10).max(1000),
        }),
      )
      .min(1),
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
