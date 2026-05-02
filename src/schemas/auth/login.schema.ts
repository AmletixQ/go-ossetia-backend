import z from "zod";

export const loginSchema = z.object({
  email: z.email("Некорректный формат email-адреса"),
  password: z
    .string("Пароль является обязательным")
    .min(8, "Пароль должен содержать минимум 8 символов"),
});
