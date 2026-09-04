import bcrypt from "bcrypt";
import { eq, sql, and, or, like } from "drizzle-orm";
import { db } from "../db/client";
import { users, type User } from "../db/schema/users";
import { NotFoundError, ValidationError } from "../types/errors";
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

    const sanitizedUsers = userRows.map(({ password: _, ...user }) => user);

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
}

export const userService = new UserService();
