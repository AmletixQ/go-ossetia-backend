import { User } from "../generated/prisma/client";

export class ResponseFormats {
  static formatUserResponse(user?: User | null) {
    if (!user) return;

    const { password, ...rest } = user;

    return rest;
  }
}
