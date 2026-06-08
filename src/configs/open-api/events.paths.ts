export const eventPaths = {
  "/events": {
    get: {
      tags: ["Events"],
      summary: "Получить список событий.",
      responses: {
        "200": {
          description: "Список событий успешно получен.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 10 },
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string", minLength: 2, maxLength: 100 },
        },
        {
          name: "price",
          in: "query",
          required: false,
          schema: { type: "number", minimum: 0 },
        },
        {
          name: "age",
          in: "query",
          required: false,
          schema: { type: "number", minimum: 0 },
        },
        {
          name: "date",
          in: "query",
          required: false,
          schema: { type: "string", format: "date-time" },
        },
      ],
    },
    post: {
      tags: ["Events"],
      summary: "Создать новое событие.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 3, maxLength: 100 },
                description: { type: "string", minLength: 10, maxLength: 500 },

                address: { type: "string", minLength: 10, maxLength: 500 },
                price: { type: "number", minimum: 0 },

                minAge: { type: "number", minimum: 0 },
                maxAge: { type: "number", minimum: 0 },

                categories: { type: "array", items: { type: "string" } },
                blocks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      content: { type: "string" },
                    },
                    required: ["title", "content"],
                  },
                },

                date: { type: "string", format: "date-time" },
              },
              required: [
                "name",
                "description",
                "address",
                "price",
                "minAge",
                "maxAge",
                "categories",
                "date",
              ],
            },
          },
        },
      },
      responses: {
        "201": { description: "Событие успешно создано." },
        "400": { description: "Некорректные данные." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
  },
  "/events/{id}": {
    get: {
      tags: ["Events"],
      summary: "Получить событие по ID.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Событие успешно получено.",
        },
        "404": {
          description: "Событие не найдено.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
    patch: {
      tags: ["Events"],
      summary: "Обновить событие по ID.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 3, maxLength: 100 },
                description: { type: "string", minLength: 10, maxLength: 500 },

                address: { type: "string", minLength: 10, maxLength: 500 },
                price: { type: "number", minimum: 0 },

                minAge: { type: "number", minimum: 0 },
                maxAge: { type: "number", minimum: 0 },

                categories: { type: "array", items: { type: "string" } },
                blocks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      content: { type: "string" },
                    },
                    required: ["title", "content"],
                  },
                },

                date: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Событие успешно создано." },
        "400": { description: "Некорректные данные." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
    delete: {
      tags: ["Events"],
      summary: "Удалить событие по ID.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "204": { description: "Событие успешно удалено." },
        "401": { description: "Пользователь не авторизован." },
        "404": { description: "Событие не найдено." },
        "5xx": { description: "Ошибка сервера." },
      },
    },
  },
  "/events/my": {
    get: {
      tags: ["Events"],
      summary: "Получить мои события.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Список моих событий успешно получен.",
        },
        "401": {
          description: "Пользователь не авторизован.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
  },
  "/events/{id}/favorite": {
    post: {
      tags: ["Events"],
      summary: "Добавить событие в избранное.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Событие успешно добавлено в избранное.",
        },
        "401": {
          description: "Пользователь не авторизован.",
        },
        "404": {
          description: "Событие не найдено.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
  },
  "/events/{id}/unfavorite": {
    post: {
      tags: ["Events"],
      summary: "Удалить событие из избранного.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Событие успешно удалено из избранного.",
        },
        "401": {
          description: "Пользователь не авторизован.",
        },
        "404": {
          description: "Событие не найдено.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
  },
  "/events/{id}/follow": {
    post: {
      tags: ["Events"],
      summary: "Подписаться на событие.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Успешно подписались на событие.",
        },
        "401": {
          description: "Пользователь не авторизован.",
        },
        "404": {
          description: "Событие не найдено.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
  },
  "/events/{id}/unfollow": {
    post: {
      tags: ["Events"],
      summary: "Отменить подписку на событие.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Успешно отменили подписку на событие.",
        },
        "401": {
          description: "Пользователь не авторизован.",
        },
        "404": {
          description: "Событие не найдено.",
        },
        "5xx": {
          description: "Ошибка сервера.",
        },
      },
    },
  },
};
