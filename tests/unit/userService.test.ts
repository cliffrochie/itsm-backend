import { describe, it, expect, vi, beforeEach } from "vitest";
import { userService } from "../../src/services/user.service";
import { db } from "../../src/db/client";
import { ValidationError } from "../../src/types/errors";

describe("UserService Client Auto-Creation & Linking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(db, "transaction").mockImplementation((async (cb: any) => cb(db)) as any);
  });

  it("auto-creates equivalent client profile when user is created and no matching client exists", async () => {
    let selectCallCount = 0;
    vi.spyOn(db, "select").mockImplementation((() => {
      selectCallCount++;
      return {
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              // 1. Uniqueness check in users -> none found
              if (selectCallCount === 1) return Promise.resolve([]);
              // 2. Lookup existing client in clients -> none found
              if (selectCallCount === 2) return Promise.resolve([]);
              // 3. getUserById -> return newly created user
              return Promise.resolve([
                {
                  id: 101,
                  username: "alice",
                  email: "alice@example.com",
                  firstName: "ALICE",
                  middleName: "MARIE",
                  lastName: "SMITH",
                  extensionName: "JR",
                  role: "user",
                  isActive: true,
                },
              ]);
            }),
          }),
        }),
      };
    }) as any);

    const insertedValues: any[] = [];
    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: (vals: any) => {
        insertedValues.push(vals);
        return {
          $returningId: vi.fn().mockResolvedValue([{ id: 101 }]),
        };
      },
    })) as any);

    const result = await userService.createUser({
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
      firstName: "Alice",
      middleName: "Marie",
      lastName: "Smith",
      extensionName: "Jr",
      contactNo: "09123456789",
      role: "user",
      isActive: true,
      officeId: 10,
      designationId: 20,
    });

    expect(result.id).toBe(101);
    expect(insertedValues).toHaveLength(2);

    // First insert: users
    expect(insertedValues[0].username).toBe("alice");

    // Second insert: clients
    const clientInsert = insertedValues[1];
    expect(clientInsert).toBeDefined();
    expect(clientInsert.firstName).toBe("ALICE");
    expect(clientInsert.middleName).toBe("MARIE");
    expect(clientInsert.lastName).toBe("SMITH");
    expect(clientInsert.extensionName).toBe("JR");
    expect(clientInsert.email).toBe("alice@example.com");
    expect(clientInsert.contactNo).toBe("09123456789");
    expect(clientInsert.officeId).toBe(10);
    expect(clientInsert.designationId).toBe(20);
    expect(clientInsert.userId).toBe(101);
  });

  it("auto-links unlinked client profile when user is created with matching email and updates office/designation", async () => {
    const mockMatchingClient = {
      id: 77,
      firstName: "JOHN",
      lastName: "DOE",
      email: "john.doe@example.com",
      userId: null,
      officeId: null,
      designationId: null,
    };

    let selectCallCount = 0;
    vi.spyOn(db, "select").mockImplementation((() => {
      selectCallCount++;
      return {
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              // 1. Uniqueness in users -> empty
              if (selectCallCount === 1) return Promise.resolve([]);
              // 2. Matching client in clients -> found unlinked client
              if (selectCallCount === 2) return Promise.resolve([mockMatchingClient]);
              // 3. getUserById -> return user
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

    let updatedFields: any = null;
    vi.spyOn(db, "update").mockImplementation((() => ({
      set: (vals: any) => {
        updatedFields = vals;
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
      officeId: 5,
      designationId: 8,
    });

    expect(updatedFields).toBeDefined();
    expect(updatedFields.userId).toBe(101);
    expect(updatedFields.officeId).toBe(5);
    expect(updatedFields.designationId).toBe(8);
  });

  it("throws ValidationError when a client with matching email is already linked to another user", async () => {
    const mockAlreadyLinkedClient = {
      id: 88,
      firstName: "EXISTING",
      lastName: "CLIENT",
      email: "conflict@example.com",
      userId: 999, // Already linked to user 999!
    };

    let selectCallCount = 0;
    vi.spyOn(db, "select").mockImplementation((() => {
      selectCallCount++;
      return {
        from: () => ({
          where: () => ({
            limit: vi.fn().mockImplementation(() => {
              if (selectCallCount === 1) return Promise.resolve([]);
              if (selectCallCount === 2) return Promise.resolve([mockAlreadyLinkedClient]);
              return Promise.resolve([]);
            }),
          }),
        }),
      };
    }) as any);

    vi.spyOn(db, "insert").mockImplementation((() => ({
      values: () => ({
        $returningId: vi.fn().mockResolvedValue([{ id: 102 }]),
      }),
    })) as any);

    await expect(
      userService.createUser({
        username: "conflictuser",
        email: "conflict@example.com",
        password: "Password123!",
        firstName: "Conflict",
        lastName: "User",
        role: "user",
        isActive: false,
      })
    ).rejects.toThrow(ValidationError);
  });
});

