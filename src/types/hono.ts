import { Role } from "../generated/prisma/enums";

export interface AppVariables {
  userId: string;
  userRole: Role;
}

export type AppEnv = {
  Variables: AppVariables;
};
