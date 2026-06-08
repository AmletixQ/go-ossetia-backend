export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Регистрация нового пользователя.",
      responses: {
        "200": {
          description:
            "Пользователь успешно зарегистрирован. Токен для подтверждения электронной почты был отправлен.",
        },
        "409": { description: "Пользователь с таким email уже существует." },
        "429": { description: "Слишком много запросов." },
        "5xx": { description: "Ошибка сервера." },
      },
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 6 },
                firstName: { type: "string", minLength: 2 },
                lastName: { type: "string", minLength: 2 },
              },
              required: ["email", "password", "firstName", "lastName"],
            },
          },
        },
      },
    },
  },
  "auth/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Подтверждение email.",
      responses: {
        "200": { description: "Email-адрес успешно подтвержден." },
        "400": { description: "Некорректные данные в запросе." },
        "401": { description: "Код истек или неверен." },
        "404": { description: "Токен и\\или email не найдены." },
        "5xx": { description: "Ошибка сервера." },
      },
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                token: { type: "string" },
              },
              required: ["email", "token"],
            },
          },
        },
      },
    },
  },
  "/auth/resend-verification-code": {
    post: {
      tags: ["Auth"],
      summary: "Повторная отправка кода подтверждения email.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { email: { type: "string", format: "email" } },
              required: ["email"],
            },
          },
        },
      },
      responses: {
        "200": { description: "Код отправлен повторно." },
        "400": { description: "Пользователь подтвержден." },
        "404": { description: "Пользователь с таким email не найден." },
        "429": { description: "Слишком много запросов." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Вход пользователя в систему.",
      responses: {
        "200": {
          description: "Пользователь успешно вошел в систему.",
        },
        "401": {
          description: "Неверный пароль.",
        },
        "404": {
          description: "Пользователь с таким email не найден.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 6 },
              },
              required: ["email", "password"],
            },
          },
        },
      },
    },
  },
  "/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Запрос сброса пароля",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { email: { type: "string", format: "email" } },
              required: ["email"],
            },
          },
        },
      },
      responses: {
        "200": { description: "Письмо отправлено." },
        "401": { description: "Пользователь с таким email не найден." },
        "429": { description: "Слишком много запросов." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
  },
  "/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Установка нового пароля.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                code: { type: "string", pattern: "^\\d{6}$" },
                newPassword: { type: "string", minLength: 8 },
              },
              required: ["email", "code", "newPassword"],
            },
          },
        },
      },
      responses: {
        "200": { description: "Пароль успешно изменён." },
        "401": { description: "Неверный или истёкший код." },
        "404": {
          description: "Пользователь с таким email или код не найден.",
        },
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Выход пользователя из системы.",
      responses: {
        "200": { description: "Пользователь успешно вышел из системы." },
        "401": { description: "Пользователь не авторизован." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
  },
};
