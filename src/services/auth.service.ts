import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { users, type User } from "../db/schema/users";
import { UnauthorizedError } from "../types/errors";
import { env } from "../config/env";
import type { LoginInput } from "../validators/auth.validator";

export class AuthService {
  async login(input: LoginInput): Promise<{ token: string; user: Omit<User, "password"> }> {
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.username, input.identifier), eq(users.email, input.identifier)))
      .limit(1);

    const user = foundUsers[0];
    if (!user) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive. Please contact your administrator.");
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET || "default-secret-32-chars-long-fallback";
    const expiresIn = (env.JWT_EXPIRES_IN || "7d") as any;

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      jwtSecret,
      { expiresIn }
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async logout(): Promise<void> {
    return;
  }
}

export const authService = new AuthService();
