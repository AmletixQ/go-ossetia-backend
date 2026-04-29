import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ResponseFactory {
  static success<T>(
    ctx: Context,
    data: T,
    status: ContentfulStatusCode = 200,
  ): Response {
    return ctx.json(data, status);
  }

  static created<T>(ctx: Context, data: T): Response {
    return this.success<T>(ctx, data, 201);
  }

  static error(
    ctx: Context,
    message: string,
    status: ContentfulStatusCode = 400,
    code: string = "ERROR",
    details?: any,
  ): Response {
    return ctx.json(
      {
        error: {
          code,
          message,
          ...(details && { details }),
        },
      },
      status,
    );
  }

  static badRequest(ctx: Context, message: string, details?: any): Response {
    return this.error(ctx, message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(
    ctx: Context,
    message: string = "Unauthorized",
  ): Response {
    return this.error(ctx, message, 401, "UNAUTHORIZED");
  }

  static forbidden(ctx: Context, message: string = "Forbidden"): Response {
    return this.error(ctx, message, 403, "FORBIDDEN");
  }

  static notFound(ctx: Context, message: string = "Not found"): Response {
    return this.error(ctx, message, 404, "NOT_FOUND");
  }

  static conflict(ctx: Context, message: string = "Conflict"): Response {
    return this.error(ctx, message, 409, "CONFLICT");
  }

  static tooManyRequests(
    ctx: Context,
    message: string = "Too many requests",
  ): Response {
    return this.error(ctx, message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(
    ctx: Context,
    message: string = "Internal server error",
  ): Response {
    return this.error(ctx, message, 500, "INTERNAL_ERROR");
  }
}
