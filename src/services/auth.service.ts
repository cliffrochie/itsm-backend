import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { users, type User } from "../db/schema/users";
import { UnauthorizedError } from "../types/errors";
import { getJwtSecret, getJwtExpiresIn } from "../config/env";
import { tokenService } from "./token.service";
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

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() as jwt.SignOptions["expiresIn"] }
    );

    // Record the issued token so logout can revoke this session specifically.
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 60 * 60 * 1000);
    await tokenService.issue(user.id, token, expiresAt);

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async logout(token: string): Promise<void> {
    await tokenService.revoke(token);
  }
}

export const authService = new AuthService();
