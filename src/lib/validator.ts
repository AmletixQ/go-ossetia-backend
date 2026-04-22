import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { ResponseFactory } from "../utils/response-factory";

export function validator<T extends z.ZodType>(
  target: "json" | "query" | "param" | "form",
  schema: T,
) {
  return zValidator(target, schema, (res, ctx) => {
    if (!res.success) {
      const details = res.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return ResponseFactory.badRequest(ctx, "Validation failed", details);
    }
  });
}
