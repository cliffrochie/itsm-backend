import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { ticketCounters } from "../db/schema/ticketCounters";

export class TicketCounterService {
  async getNextTicketNo(year = new Date().getFullYear(), month = new Date().getMonth() + 1): Promise<string> {
    const existing = await db
      .select()
      .from(ticketCounters)
      .where(and(eq(ticketCounters.year, year), eq(ticketCounters.month, month)))
      .limit(1);

    let nextCount = 1;

    if (existing.length === 0) {
      await db.insert(ticketCounters).values({
        year,
        month,
        lastCount: 1,
      });
    } else {
      nextCount = existing[0]!.lastCount + 1;
      await db
        .update(ticketCounters)
        .set({ lastCount: nextCount })
        .where(and(eq(ticketCounters.year, year), eq(ticketCounters.month, month)));
    }

    const monthPadded = String(month).padStart(2, "0");
    const countPadded = String(nextCount).padStart(4, "0");
    return `ST-${year}${monthPadded}-${countPadded}`;
  }
}

export const ticketCounterService = new TicketCounterService();
