import z from "zod";
import { UnauthorizedError } from "../../utils";

export const updateUserSchema = z
  .object({
    email: z.email().optional(),
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    age: z.number().min(0).optional(),

    password: z.string().min(6).max(100).optional(),
    confirmPassword: z.string().min(6).max(100).optional(),
  })
  .refine((data) => {
    if (data.password !== data.confirmPassword) {
      throw new UnauthorizedError("Passwords must match");
    }
    return true;
  });
