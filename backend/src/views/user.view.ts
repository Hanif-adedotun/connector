import type { User } from "@prisma/client";

export interface UserView {
  id: string;
  email: string;
  firstName: string | null;
}

export function serializeUser(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
  };
}
