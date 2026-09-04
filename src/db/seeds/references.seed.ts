import { db } from "../client";
import { offices } from "../schema/offices";
import { designations } from "../schema/designations";
import { eq } from "drizzle-orm";

export async function seedReferences(): Promise<{ officeIds: number[]; designationIds: number[] }> {
  console.log("Seeding offices and designations...");

  const standardOffices = [
    { name: "IT Support Office", code: "ITSO" },
    { name: "Human Resources Management", code: "HRMD" },
    { name: "Finance and Accounting", code: "FIN" },
    { name: "Office of the General Manager", code: "OGM" },
  ];

  const officeIds: number[] = [];
  for (const item of standardOffices) {
    const existing = await db.select().from(offices).where(eq(offices.code, item.code)).limit(1);
    if (existing.length === 0) {
      const [inserted] = await db.insert(offices).values(item).$returningId();
      officeIds.push(inserted.id);
    } else {
      officeIds.push(existing[0]!.id);
    }
  }

  const standardDesignations = [
    { name: "IT Specialist" },
    { name: "Systems Administrator" },
    { name: "Administrative Officer" },
    { name: "Accountant" },
  ];

  const designationIds: number[] = [];
  for (const item of standardDesignations) {
    const existing = await db.select().from(designations).where(eq(designations.name, item.name)).limit(1);
    if (existing.length === 0) {
      const [inserted] = await db.insert(designations).values(item).$returningId();
      designationIds.push(inserted.id);
    } else {
      designationIds.push(existing[0]!.id);
    }
  }

  console.log(`Offices seeded: ${officeIds.length}, Designations seeded: ${designationIds.length}`);
  return { officeIds, designationIds };
}
