import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prisma } from "./lib/prisma";

const app = new Hono();

app.get("/", async (c) => {
  const res = await prisma.event.findMany();

  return c.json({ events: res });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
