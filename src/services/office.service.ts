import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { offices, type Office } from "../db/schema/offices";
import { NotFoundError, ValidationError } from "../types/errors";
import type { CreateOfficeInput, UpdateOfficeInput } from "../validators/office.validator";

export class OfficeService {
  async listOffices(): Promise<Office[]> {
    return db.select().from(offices);
  }

  async getOfficeById(id: number): Promise<Office> {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundError(`Office with ID ${id} not found.`);
    }
    const [office] = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
    if (!office) {
      throw new NotFoundError(`Office with ID ${id} not found.`);
    }
    return office;
  }

  async createOffice(input: CreateOfficeInput): Promise<Office> {
    const existing = await db.select().from(offices).where(eq(offices.code, input.code)).limit(1);
    if (existing.length > 0) {
      throw new ValidationError("Validation failed.", {
        code: ["Office code has already been taken."],
      });
    }

    const [inserted] = await db.insert(offices).values(input).$returningId();
    return this.getOfficeById(inserted.id);
  }

  async updateOffice(id: number, input: UpdateOfficeInput): Promise<Office> {
    await this.getOfficeById(id);
    if (Object.keys(input).length > 0) {
      await db.update(offices).set(input).where(eq(offices.id, id));
    }
    return this.getOfficeById(id);
  }

  async deleteOffice(id: number): Promise<void> {
    await this.getOfficeById(id);
    await db.delete(offices).where(eq(offices.id, id));
  }
}

export const officeService = new OfficeService();
