import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { designations, type Designation } from "../db/schema/designations";
import { NotFoundError } from "../types/errors";
import type { CreateDesignationInput, UpdateDesignationInput } from "../validators/designation.validator";

export class DesignationService {
  async listDesignations(): Promise<Designation[]> {
    return db.select().from(designations);
  }

  async getDesignationById(id: number): Promise<Designation> {
    const [designation] = await db.select().from(designations).where(eq(designations.id, id)).limit(1);
    if (!designation) {
      throw new NotFoundError(`Designation with ID ${id} not found.`);
    }
    return designation;
  }

  async createDesignation(input: CreateDesignationInput): Promise<Designation> {
    const [inserted] = await db.insert(designations).values(input).$returningId();
    return this.getDesignationById(inserted.id);
  }

  async updateDesignation(id: number, input: UpdateDesignationInput): Promise<Designation> {
    await this.getDesignationById(id);
    if (Object.keys(input).length > 0) {
      await db.update(designations).set(input).where(eq(designations.id, id));
    }
    return this.getDesignationById(id);
  }

  async deleteDesignation(id: number): Promise<void> {
    await this.getDesignationById(id);
    await db.delete(designations).where(eq(designations.id, id));
  }
}

export const designationService = new DesignationService();
