import bcrypt from "bcrypt";
import { db } from "../client";
import { users } from "../schema/users";
import { eq } from "drizzle-orm";

export async function seedUsers(): Promise<{ adminId: number; engineerId: number; staffId: number }> {
  console.log("Seeding users...");

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 10);

  // Admin user
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  let adminId: number;

  if (existingAdmin.length === 0) {
    const [inserted] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@itsm.local",
        password: hashedPassword,
        firstName: "SYSTEM",
        lastName: "ADMINISTRATOR",
        role: "admin",
        isActive: true,
      })
      .$returningId();
    adminId = inserted.id;
  } else {
    adminId = existingAdmin[0]!.id;
  }

  // Engineer user
  const existingEng = await db.select().from(users).where(eq(users.username, "engineer1")).limit(1);
  let engineerId: number;

  if (existingEng.length === 0) {
    const [inserted] = await db
      .insert(users)
      .values({
        username: "engineer1",
        email: "engineer@itsm.local",
        password: hashedPassword,
        firstName: "ALEX",
        lastName: "MERCER",
        role: "service_engineer",
        isActive: true,
      })
      .$returningId();
    engineerId = inserted.id;
  } else {
    engineerId = existingEng[0]!.id;
  }

  // Staff user
  const existingStaff = await db.select().from(users).where(eq(users.username, "staff1")).limit(1);
  let staffId: number;

  if (existingStaff.length === 0) {
    const [inserted] = await db
      .insert(users)
      .values({
        username: "staff1",
        email: "staff@itsm.local",
        password: hashedPassword,
        firstName: "SARAH",
        lastName: "CONNOR",
        role: "staff",
        isActive: true,
      })
      .$returningId();
    staffId = inserted.id;
  } else {
    staffId = existingStaff[0]!.id;
  }

  console.log(`Users seeded: admin (id: ${adminId}), engineer (id: ${engineerId}), staff (id: ${staffId})`);
  return { adminId, engineerId, staffId };
}
