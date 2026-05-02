import z from "zod";

export const verifyEmailSchema = z.object({
  email: z.email("Некорректный формат email-адреса"),
  code: z
    .string("Код верификации является обязательным")
    .length(6, "Код верификации должен содержать 6 символов"),
});
