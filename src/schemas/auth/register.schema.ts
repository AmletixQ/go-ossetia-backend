import z from "zod";

export const registerSchema = z.object({
  email: z.email("Некорректный формат email-адреса"),
  password: z
    .string("Пароль является обязательным")
    .min(8, "Пароль должен содержать больше 8 символов"),
  firstName: z
    .string("Имя является обязательным")
    .min(2, "Имя должно содержать больше 2 символов"),
  lastName: z
    .string("Фамилия является обязательной")
    .min(2, "Фамилия должна содержать больше 2 символов"),
});
