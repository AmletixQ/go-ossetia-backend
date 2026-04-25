import z from "zod";
import { EventCategory } from "../../generated/prisma/enums";

export const eventFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),

  category: z.enum(EventCategory).optional(),

  price: z.coerce.number().min(0).optional(),
  age: z.coerce.number().min(0).optional(),

  search: z.string().min(4).max(50).optional(),
  date: z.coerce.date().min(new Date()).optional(),
});
