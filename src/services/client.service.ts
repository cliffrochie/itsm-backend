import { eq, sql, and, or, like } from "drizzle-orm";
import { db } from "../db/client";
import { clients, type Client } from "../db/schema/clients";
import { users } from "../db/schema/users";
import { NotFoundError } from "../types/errors";
import type { CreateClientInput, UpdateClientInput, ClientQueryInput } from "../validators/client.validator";

export class ClientService {
  async listClients(query: ClientQueryInput): Promise<{
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.officeId) {
      conditions.push(eq(clients.officeId, query.officeId));
    }
    if (query.designationId) {
      conditions.push(eq(clients.designationId, query.designationId));
    }
    if (query.userId) {
      conditions.push(eq(clients.userId, query.userId));
    }
    if (query.email) {
      conditions.push(eq(clients.email, query.email.trim().toLowerCase()));
    }
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        or(
          like(clients.firstName, searchPattern),
          like(clients.lastName, searchPattern),
          like(clients.contactNo, searchPattern),
          like(clients.email, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);
    const lastPage = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(clients)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    return {
      clients: rows,
      total,
      page,
      limit,
      lastPage,
    };
  }

  async getClientById(id: number): Promise<Client> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (!client) {
      throw new NotFoundError(`Client with ID ${id} not found.`);
    }
    return client;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const email = input.email ? input.email.trim().toLowerCase() : null;

    let userId = input.userId || null;
    if (!userId && email) {
      const [matchedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }

    const [inserted] = await db
      .insert(clients)
      .values({
        firstName: input.firstName.toUpperCase(),
        middleName: input.middleName ? input.middleName.toUpperCase() : null,
        lastName: input.lastName.toUpperCase(),
        extensionName: input.extensionName ? input.extensionName.toUpperCase() : null,
        email,
        contactNo: input.contactNo || null,
        officeId: input.officeId || null,
        designationId: input.designationId || null,
        userId,
      })
      .$returningId();

    return this.getClientById(inserted.id);
  }

  async updateClient(id: number, input: UpdateClientInput): Promise<Client> {
    await this.getClientById(id);

    const updateValues: Record<string, unknown> = {};
    if (input.firstName !== undefined) updateValues.firstName = input.firstName.toUpperCase();
    if (input.middleName !== undefined) updateValues.middleName = input.middleName ? input.middleName.toUpperCase() : null;
    if (input.lastName !== undefined) updateValues.lastName = input.lastName.toUpperCase();
    if (input.extensionName !== undefined) updateValues.extensionName = input.extensionName ? input.extensionName.toUpperCase() : null;
    if (input.email !== undefined) updateValues.email = input.email ? input.email.trim().toLowerCase() : null;
    if (input.contactNo !== undefined) updateValues.contactNo = input.contactNo;
    if (input.officeId !== undefined) updateValues.officeId = input.officeId;
    if (input.designationId !== undefined) updateValues.designationId = input.designationId;
    if (input.userId !== undefined) updateValues.userId = input.userId;

    if (Object.keys(updateValues).length > 0) {
      await db.update(clients).set(updateValues).where(eq(clients.id, id));
    }

    return this.getClientById(id);
  }

  async deleteClient(id: number): Promise<void> {
    await this.getClientById(id);
    await db.delete(clients).where(eq(clients.id, id));
  }
}

export const clientService = new ClientService();
