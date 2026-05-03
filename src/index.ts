import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { auth, events } from "./routes";
import { errorHandler } from "./middlewares";

const app = new Hono();

app.use(logger());
app.onError(errorHandler);

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
