import { db } from "../client";
import { clients } from "../schema/clients";

export async function seedClients(params: {
  officeId: number;
  designationId: number;
  staffUserId: number;
}): Promise<{ walkinClientId: number; staffClientId: number }> {
  console.log("Seeding clients...");

  // 1. Walk-in external client (userId: null)
  const [walkin] = await db
    .insert(clients)
    .values({
      firstName: "MARIA",
      middleName: "SANTOS",
      lastName: "DELA CRUZ",
      email: "maria.delacruz@example.com",
      contactNo: "09170001122",
      officeId: params.officeId,
      designationId: params.designationId,
      userId: null,
    })
    .$returningId();

  // 2. Internal employee acting as client (userId: staffUserId)
  const [staffClient] = await db
    .insert(clients)
    .values({
      firstName: "SARAH",
      middleName: null,
      lastName: "CONNOR",
      email: "sarah.connor@itsm.local",
      contactNo: "09189998877",
      officeId: params.officeId,
      designationId: params.designationId,
      userId: params.staffUserId,
    })
    .$returningId();

  console.log(`Clients seeded: walkin (id: ${walkin.id}), staff client (id: ${staffClient.id}, user_id: ${params.staffUserId})`);
  return { walkinClientId: walkin.id, staffClientId: staffClient.id };
}
