import { ErrorHandler } from "hono";
import { ZodError } from "zod";

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ResponseFactory, HttpError } from "../utils";

export const errorHandler: ErrorHandler = (err, ctx) => {
  if (err instanceof HttpError) {
    console.log("HTTP error");
    return ResponseFactory[err.responseFactoryMethod](ctx, err.message);
  }

  if (err instanceof ZodError) {
    console.log("Zod validation error");
    return ResponseFactory.badRequest(ctx, "Validation failed");
  }

  if (err instanceof PrismaClientKnownRequestError) {
    console.log("Prisma error");
    if (err.code === "P2025") {
      return ResponseFactory.notFound(ctx, "Record is not found");
    }
  }

  return ResponseFactory.internal(ctx, "Internal server error");
};
