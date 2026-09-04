import { describe, it, expect, vi } from "vitest";
import { clientService } from "../../src/services/client.service";
import { db } from "../../src/db/client";

describe("ClientService Auto-linking", () => {
  it("auto-links client to existing user when userId is omitted and email matches", async () => {
    // Mock user lookup
    const mockUser = { id: 42, email: "john.doe@example.com" };
    const mockCreatedClient = {
      id: 99,
      firstName: "JOHN",
      lastName: "DOE",
      email: "john.doe@example.com",
      userId: 42,
    };

    vi.spyOn(db, "select").mockImplementation((() => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    })) as any);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: (vals: any) => {
        expect(vals.userId).toBe(42);
        expect(vals.email).toBe("john.doe@example.com");
        return {
          $returningId: vi.fn().mockResolvedValue([{ id: 99 }]),
        };
      },
    })) as any);

    vi.spyOn(clientService, "getClientById").mockResolvedValue(mockCreatedClient as any);

    const result = await clientService.createClient({
      firstName: "John",
      lastName: "Doe",
      email: "  JOHN.DOE@EXAMPLE.COM  ",
    });

    expect(result.userId).toBe(42);
  });
});
