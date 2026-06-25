import { hash } from "argon2";
import { User } from "../generated/prisma/client";
import { prisma } from "../lib";
import { EventModel } from "../generated/prisma/models";

interface UsersService {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getFollowedEvents(userId: string): Promise<EventModel[]>;
  getFavouritedEvents(userId: string): Promise<EventModel[]>;

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

  async getFollowedEvents(userId) {
    const userEvents = await prisma.user.findUnique({
      where: { id: userId },
      include: { followingEvents: true },
    });
    console.log(userEvents);

    return userEvents?.followingEvents || [];
  },

  async getFavouritedEvents(userId) {
    const userFavoriteEvents = await prisma.user.findUnique({
      where: { id: userId },
      include: { favouritedEvents: true },
    });

    return userFavoriteEvents?.favouritedEvents || [];
  },

  async update(id, data) {
    if (data.password) data.password = await hash(data.password);

    return await prisma.user.update({ where: { id }, data });
  },

  async delete(id) {
    return await prisma.user.delete({ where: { id } });
  },
};
