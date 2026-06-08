import { authPaths } from "./auth.paths";
import { eventPaths } from "./events.paths";

export const OPEN_API_CONFIG = {
  openapi: "3.0.0",
  info: {
    title: "Go Ossetia API",
    description: "API documentation for Go Ossetia",
    version: "1.0.0",
  },
  contact: {
    name: "Go Ossetia Support",
    email: "support@go-ossetia.com",
    url: "https://go-ossetia.com/support",
  },
  servers: [
    { url: "http://localhost:3000/api", description: "Local development" },
  ],
  tags: [
    {
      name: "Auth",
      description: "Методы для идентификации и аутентификации пользователей.",
    },
    {
      name: "Events",
      description: "Методы для работы с событиями.",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "JWT токен авторизации сохраняется в cookies и используется для доступа к защищенным ресурсам.",
      },
    },
  },
  paths: {
    ...authPaths,
    ...eventPaths,
  },
};
