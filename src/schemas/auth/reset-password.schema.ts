import z from "zod";

export const resetPasswordSchema = z
  .object({
    email: z.email("Некорректный формат email"),
    code: z
      .string("Код подтверждения должен состоять из 6 символов")
      .length(6, "Код подтверждения должен состоять из 6 символов"),
    newPassword: z
      .string("Пароль должен содержать минимум 6 символов")
      .min(6, "Пароль должен содержать минимум 6 символов"),
  })
  .refine((data) => Number.isInteger(+data.code), {
    message: "Код подтверждения должен состоять из 6 цифр",
    path: ["code"],
  });
