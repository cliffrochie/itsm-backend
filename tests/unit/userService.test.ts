import { describe, it, expect, vi } from "vitest";
import { userService } from "../../src/services/user.service";
import { db } from "../../src/db/client";

describe("UserService Auto-linking", () => {
  it("auto-links unlinked client profile when user is created with matching email", async () => {
    // 1. Mock uniqueness check (no existing user with username/email)
    // 2. Mock matching client lookup (finds client id 77 with userId null)
    const mockMatchingClient = {
      id: 77,
      firstName: "JOHN",
      lastName: "DOE",
      email: "john.doe@example.com",
      userId: null,
    };

    let selectCallCount = 0;
    vi.spyOn(db, "select").mockImplementation((() => {
      selectCallCount++;
      return {
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              // First select: check uniqueness in users -> return empty
              if (selectCallCount === 1) return Promise.resolve([]);
              // Second select: check matching client in clients -> return matching client
              if (selectCallCount === 2) return Promise.resolve([mockMatchingClient]);
              // Third select: getUserById -> return user
              return Promise.resolve([
                {
                  id: 101,
                  username: "johndoe",
                  email: "john.doe@example.com",
                  firstName: "JOHN",
                  lastName: "DOE",
                  role: "user",
                  isActive: false,
                },
              ]);
            }),
          }),
        }),
      };
    }) as any);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: () => ({
        $returningId: vi.fn().mockResolvedValue([{ id: 101 }]),
      }),
    })) as any);

    let clientUpdateCalled = false;
    vi.spyOn(db, "update").mockImplementation((() => ({
      set: (vals: any) => {
        expect(vals.userId).toBe(101);
        clientUpdateCalled = true;
        return {
          where: vi.fn().mockResolvedValue({}),
        };
      },
    })) as any);

    await userService.createUser({
      username: "johndoe",
      email: "john.doe@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
      role: "user",
      isActive: false,
    });

    expect(clientUpdateCalled).toBe(true);
  });
});
