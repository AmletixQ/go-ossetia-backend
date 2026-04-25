import { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { ResponseFactory } from "../utils/response-factory";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const errorHandler: ErrorHandler = (err, ctx) => {
  console.error(err);
  
  if (err instanceof ZodError) {
    console.log("Handler error");
    return ResponseFactory.badRequest(ctx, "Validation failed");
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2025")
      return ResponseFactory.notFound(ctx, "Record is not found");
  }

  return ResponseFactory.internal(ctx, "Internal server error");
};
