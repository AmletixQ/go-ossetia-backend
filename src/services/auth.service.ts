import { hash, verify } from "argon2";

import { prisma } from "../lib";

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils";

import { User } from "../generated/prisma/client";
import { tokenService } from "./token.service";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface VerifyEmailData {
  email: string;
  code: string;
}

interface ResendVerificationCodeData {
  email: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

interface AuthService {
  register(data: RegisterData): Promise<User>;
  login(data: LoginData): Promise<User>;

  verifyEmail(data: VerifyEmailData): Promise<void>;
  resendVerificationCode(data: ResendVerificationCodeData): Promise<void>;

  forgotPassword(data: ForgotPasswordData): Promise<void>;
  resetPassword(data: ResetPasswordData): Promise<void>;
}

export const authService: AuthService = {
  async register({ email, password, firstName, lastName }) {
    const verifiedUser = await prisma.user.findFirst({
      where: { email, isEmailVerified: true },
    });

    if (verifiedUser)
      throw new ConflictError(
        "Пользователь с таким email-адресом уже существует",
      );

    const hashedPassword = await hash(password);
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    };

    const user = await prisma.user.upsert({
      where: { email },
      update: userData,
      create: { ...userData, isEmailVerified: false },
    });

    await tokenService.generateOrRefreshTokenAndSendEmail(
      email,
      "EMAIL_VERIFICATION",
    );

    return user;
  },
  async login(data) {
    const { email, password } = data;

    const isExistUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!isExistUser)
      throw new NotFoundError("Пользователь с таким email-адресом не найден");

    const isValidPassword = await verify(isExistUser.password, password);

    if (!isValidPassword) throw new UnauthorizedError("Неверный пароль");

    return isExistUser;
  },
  async verifyEmail({ email, code }) {
    await tokenService.verifyAndConsume(email, code, "EMAIL_VERIFICATION");

    await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
  },
  async resendVerificationCode(data) {
    const { email } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      throw new NotFoundError("Пользователь с таким email не существует");

    if (user.isEmailVerified)
      throw new BadRequestError("Email уже подтвержден");

    await tokenService.generateOrRefreshTokenAndSendEmail(
      email,
      "EMAIL_VERIFICATION",
    );
  },
  async forgotPassword(data) {
    const { email } = data;

    await tokenService.generateOrRefreshTokenAndSendEmail(
      email,
      "PASSWORD_RESET",
    );
  },
  async resetPassword(data) {
    const { email, code, newPassword } = data;

    await tokenService.verifyAndConsume(email, code, "PASSWORD_RESET");

    const hashedPassword = await hash(newPassword);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
  },
};
