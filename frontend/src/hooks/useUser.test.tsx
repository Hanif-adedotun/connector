/** @jest-environment jsdom */

jest.mock("../lib/api-client", () => ({
  api: jest.fn(),
}));

import { displayFirstName, fetchUser, useUser } from "./useUser";
import { api } from "../lib/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../__tests__/helpers/wrapper";

describe("displayFirstName", () => {
  it("uses firstName when available", () => {
    expect(
      displayFirstName({ id: "1", email: "a@b.com", firstName: "Alice Smith", timezone: null }),
    ).toBe("Alice");
  });

  it("falls back to email local part", () => {
    expect(
      displayFirstName({ id: "1", email: "bob@example.com", firstName: null, timezone: null }),
    ).toBe("bob");
  });

  it("returns there when user is null", () => {
    expect(displayFirstName(null)).toBe("there");
  });
});

describe("useUser", () => {
  it("fetchUser returns user from api", async () => {
    (api as jest.Mock).mockResolvedValue({
      user: { id: "1", email: "a@b.com", firstName: "Alice", timezone: null },
    });
    const user = await fetchUser();
    expect(user.firstName).toBe("Alice");
  });

  it("loads user in hook", async () => {
    (api as jest.Mock).mockResolvedValue({
      user: { id: "1", email: "a@b.com", firstName: "Alice", timezone: null },
    });
    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.firstName).toBe("Alice");
  });
});
