import { describe, it, expect } from "vitest";
import { formatSuccess, formatError, formatPaginated } from "../../src/responses/envelope";

describe("API Contract Envelopes", () => {
  it("formats standard success envelope", () => {
    const data = { id: 1, name: "Test User" };
    const response = formatSuccess(data, "User created successfully.");

    expect(response).toEqual({
      data: { id: 1, name: "Test User" },
      message: "User created successfully.",
      errors: null,
    });
  });

  it("formats standard error envelope with field errors", () => {
    const errors = { email: ["Invalid email address format."] };
    const response = formatError("Validation failed.", errors);

    expect(response).toEqual({
      data: null,
      message: "Validation failed.",
      errors: { email: ["Invalid email address format."] },
    });
  });

  it("formats error envelope without specific field errors", () => {
    const response = formatError("Unauthenticated.");

    expect(response).toEqual({
      data: null,
      message: "Unauthenticated.",
      errors: null,
    });
  });

  it("formats paginated envelope with meta", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const meta = {
      currentPage: 1,
      lastPage: 3,
      perPage: 15,
      total: 45,
    };
    const response = formatPaginated(items, meta, "Items retrieved successfully.");

    expect(response).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        current_page: 1,
        last_page: 3,
        per_page: 15,
        total: 45,
      },
      message: "Items retrieved successfully.",
      errors: null,
    });
  });
});
