import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { auth, events } from "./routes";
import { errorHandler } from "./middlewares";
import { OPEN_API_CONFIG } from "./configs";

const app = new Hono();
app.basePath("/api");

app.use(logger());
app.onError(errorHandler);

app.get("/doc", (ctx) => ctx.json(OPEN_API_CONFIG));
app.get("/open-api", swaggerUI({ title: "Go Ossetia API", url: "/doc" }));

app.route("/auth", auth);
app.route("/events", events);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
