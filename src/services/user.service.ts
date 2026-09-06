import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { eq, sql, and, or, like, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { users, type User } from "../db/schema/users";
import { clients } from "../db/schema/clients";
import { NotFoundError, UnauthorizedError, ValidationError } from "../types/errors";
import { tokenService } from "./token.service";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from "../validators/user.validator";

export class UserService {
  async listUsers(query: UserQueryInput): Promise<{
    users: Omit<User, "password">[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.role) {
      conditions.push(eq(users.role, query.role));
    }
    if (typeof query.isActive === "boolean") {
      conditions.push(eq(users.isActive, query.isActive));
    }
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        or(
          like(users.username, searchPattern),
          like(users.email, searchPattern),
          like(users.firstName, searchPattern),
          like(users.lastName, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);
    const lastPage = Math.ceil(total / limit) || 1;

    const userRows = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const sanitizedUsers = userRows.map((u: User) => {
      const { password: _, ...user } = u;
      return user;
    });

    return {
      users: sanitizedUsers,
      total,
      page,
      limit,
      lastPage,
    };
  }

  async getUserById(id: number): Promise<Omit<User, "password">> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(input: CreateUserInput): Promise<Omit<User, "password">> {
    // Check username or email uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, input.username), eq(users.email, input.email)))
      .limit(1);

    if (existing.length > 0) {
      const field = existing[0]!.username === input.username ? "username" : "email";
      throw new ValidationError("Validation failed.", {
        [field]: [`The ${field} has already been taken.`],
      });
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const [inserted] = await db
      .insert(users)
      .values({
        username: input.username,
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName.toUpperCase(),
        middleName: input.middleName ? input.middleName.toUpperCase() : null,
        lastName: input.lastName.toUpperCase(),
        extensionName: input.extensionName ? input.extensionName.toUpperCase() : null,
        contactNo: input.contactNo || null,
        avatar: input.avatar || null,
        role: input.role,
        isActive: input.isActive,
      })
      .$returningId();

    // Auto-link any existing unlinked client profile with matching email
    const userEmail = input.email.trim().toLowerCase();
    const [matchingClient] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.email, userEmail), isNull(clients.userId)))
      .limit(1);

    if (matchingClient) {
      await db
        .update(clients)
        .set({ userId: inserted.id })
        .where(eq(clients.id, matchingClient.id));
    }

    return this.getUserById(inserted.id);
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<Omit<User, "password">> {
    await this.getUserById(id);

    const updateValues: Record<string, unknown> = {};
    if (input.firstName !== undefined) updateValues.firstName = input.firstName.toUpperCase();
    if (input.middleName !== undefined) updateValues.middleName = input.middleName ? input.middleName.toUpperCase() : null;
    if (input.lastName !== undefined) updateValues.lastName = input.lastName.toUpperCase();
    if (input.extensionName !== undefined) updateValues.extensionName = input.extensionName ? input.extensionName.toUpperCase() : null;
    if (input.contactNo !== undefined) updateValues.contactNo = input.contactNo;
    if (input.avatar !== undefined) updateValues.avatar = input.avatar;
    if (input.role !== undefined) updateValues.role = input.role;
    if (input.isActive !== undefined) updateValues.isActive = input.isActive;

    if (Object.keys(updateValues).length > 0) {
      await db.update(users).set(updateValues).where(eq(users.id, id));
    }

    return this.getUserById(id);
  }

  async toggleStatus(id: number, isActive: boolean): Promise<Omit<User, "password">> {
    await this.getUserById(id);
    await db.update(users).set({ isActive }).where(eq(users.id, id));
    return this.getUserById(id);
  }

  async deleteUser(id: number): Promise<void> {
    await this.getUserById(id);
    await db.delete(users).where(eq(users.id, id));
  }

  /**
   * Self-service password change: the caller proves they know the current
   * password, then every other session is dropped. `currentToken` is the
   * request's own bearer token and is spared so the caller stays signed in.
   */
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
    currentToken?: string
  ): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedError("Current password is incorrect.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
    await tokenService.revokeAllForUser(id, currentToken);
  }

  /**
   * Admin-mediated reset for a locked-out user. The server mints a one-time
   * temporary password, returns it once for the admin to relay, and revokes
   * every session the target user holds.
   */
  async resetPassword(id: number): Promise<{ temporaryPassword: string }> {
    await this.getUserById(id);

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
    await tokenService.revokeAllForUser(id);

    return { temporaryPassword };
  }

  /**
   * A 16-character password that always satisfies the change/reset policy
   * (at least one letter and one digit). Ambiguous glyphs (0/O, 1/l/I) are
   * left out so it survives being read aloud or copied by hand.
   */
  private generateTemporaryPassword(length = 16): string {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
    const digits = "23456789";
    const all = letters + digits;
    const bytes = randomBytes(length);

    const chars = [
      letters[bytes[0]! % letters.length],
      digits[bytes[1]! % digits.length],
    ];
    for (let i = 2; i < length; i++) {
      chars.push(all[bytes[i]! % all.length]);
    }
    return chars.join("");
  }
}

export const userService = new UserService();
