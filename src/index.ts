import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";

import { auth, events, users } from "./routes";
import { errorHandler } from "./middlewares";
import { HOME_TEMPLATE, OPEN_API_CONFIG } from "./configs";

const app = new Hono().basePath("/api");

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  }),
);
app.use(logger());
app.onError(errorHandler);

app.get("/", (ctx) => ctx.html(HOME_TEMPLATE));
app.get("/doc", (ctx) => ctx.json(OPEN_API_CONFIG));
app.get("/open-api", swaggerUI({ title: "Go Ossetia API", url: "/api/doc" }));

app.route("/auth", auth);
app.route("/events", events);
app.route("/users", users);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3000),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}/api`);
  },
);
