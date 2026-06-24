import { User } from "../generated/prisma/client";
import { prisma } from "../lib";

interface UsersService {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;

  create(data: Omit<User, "id">): Promise<User>;
  update(id: string, data: Partial<Omit<User, "id">>): Promise<User | null>;
  delete(id: string): Promise<User | null>;
}

export const usersService: UsersService = {
  async getAll() {
    return await prisma.user.findMany();
  },

  async getById(id) {
    return await prisma.user.findUnique({ where: { id } });
  },

  async getByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  },

  async create(data) {
    return await prisma.user.create({ data });
  },

  async update(id, data) {
    return await prisma.user.update({ where: { id }, data });
  },

  async delete(id) {
    return await prisma.user.delete({ where: { id } });
  },
};
