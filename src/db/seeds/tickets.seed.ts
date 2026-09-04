import { db } from "../client";
import { serviceTickets } from "../schema/serviceTickets";
import { serviceTicketHistories } from "../schema/serviceTicketHistories";
import { notifications } from "../schema/notifications";
import { ticketCounterService } from "../../services/ticketCounter.service";

export async function seedTickets(params: {
  clientId: number;
  engineerId: number;
  adminId: number;
}): Promise<void> {
  console.log("Seeding sample tickets and histories...");

  const ticketNo1 = await ticketCounterService.getNextTicketNo();
  const [ticket1] = await db
    .insert(serviceTickets)
    .values({
      ticketNo: ticketNo1,
      taskType: "Hardware Repair",
      title: "Workstation powers on then immediately shuts down",
      natureOfWork: "Power supply unit diagnostic and replacement",
      serialNo: "DELL-OPT-9988",
      equipmentType: "Desktop PC",
      serviceStatus: "open",
      priority: "high",
      remarks: "Critical station for finance operations",
      clientId: params.clientId,
      createdById: params.adminId,
    })
    .$returningId();

  await db.insert(serviceTicketHistories).values({
    serviceTicketId: ticket1.id,
    performedById: params.adminId,
    action: "Ticket Created",
    notes: `Service ticket ${ticketNo1} logged with High priority.`,
  });

  const ticketNo2 = await ticketCounterService.getNextTicketNo();
  const [ticket2] = await db
    .insert(serviceTickets)
    .values({
      ticketNo: ticketNo2,
      taskType: "Network Support",
      title: "Network printer unreachable from HR subnet",
      natureOfWork: "IP configuration and gateway reset",
      serialNo: "HP-LJ-400-HR",
      equipmentType: "Network Laser Printer",
      serviceStatus: "in_progress",
      priority: "medium",
      remarks: "Printer display shows ready but pings fail",
      clientId: params.clientId,
      serviceEngineerId: params.engineerId,
      createdById: params.adminId,
      updatedById: params.engineerId,
    })
    .$returningId();

  await db.insert(serviceTicketHistories).values([
    {
      serviceTicketId: ticket2.id,
      performedById: params.adminId,
      action: "Ticket Created",
      notes: `Service ticket ${ticketNo2} logged.`,
    },
    {
      serviceTicketId: ticket2.id,
      performedById: params.adminId,
      action: "Assigned Engineer",
      notes: `Assigned to engineer ID: ${params.engineerId}`,
    },
    {
      serviceTicketId: ticket2.id,
      performedById: params.engineerId,
      action: "Status changed: open -> in_progress",
      notes: "Diagnosing switch port configuration.",
    },
  ]);

  // Seed notification for engineer
  await db.insert(notifications).values({
    userId: params.engineerId,
    ticketId: ticket2.id,
    title: "Ticket Assigned",
    message: `You have been assigned to service ticket ${ticketNo2}.`,
    isRead: false,
  });

  console.log(`Sample tickets seeded: ${ticketNo1}, ${ticketNo2}`);
}
