import { User } from "../generated/prisma/client";

export class ResponseFormats {
  static formatUserResponse(user: User) {
    const { password, ...rest } = user;

    return rest;
  }
}
