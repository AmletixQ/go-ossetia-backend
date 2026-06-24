import { ResponseFactoryMethod } from "./response.factory";

export class HttpError extends Error {
  responseFactoryMethod: ResponseFactoryMethod = "internal";

  constructor(
    public status: number,
    message: string,
    responseFactoryMethod: ResponseFactoryMethod,
  ) {
    super(message);
    this.name = "HttpError";
    this.responseFactoryMethod = responseFactoryMethod;
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message, "notFound");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message, "badRequest");
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message, "forbidden");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message, "conflict");
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string) {
    super(429, message, "tooManyRequests");
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string) {
    super(500, message, "internal");
    this.name = "InternalServerError";
  }
}
