import { seedUsers } from "./users.seed";
import { seedReferences } from "./references.seed";
import { seedClients } from "./clients.seed";
import { seedTickets } from "./tickets.seed";
import { poolConnection } from "../client";

async function main() {
  console.log("=== Starting ITSM Database Seeder ===");
  try {
    const { adminId, engineerId, staffId } = await seedUsers();
    const { officeIds, designationIds } = await seedReferences();
    const { walkinClientId } = await seedClients({
      officeId: officeIds[0]!,
      designationId: designationIds[0]!,
      staffUserId: staffId,
    });
    await seedTickets({
      clientId: walkinClientId,
      engineerId,
      adminId,
    });
    console.log("=== Database Seeding Complete! ===");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await poolConnection.end();
  }
}

main();
