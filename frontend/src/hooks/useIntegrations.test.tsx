/** @jest-environment jsdom */

jest.mock("../lib/api-client", () => ({
  api: jest.fn(),
}));

import { renderHook, waitFor, act } from "@testing-library/react";
import { useIntegrations } from "./useIntegrations";
import { api } from "../lib/api-client";
import { createWrapper } from "../__tests__/helpers/wrapper";

describe("useIntegrations", () => {
  it("loads integrations", async () => {
    (api as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "i1",
          provider: "gmail",
          status: "active",
          scope: null,
          lastPolledAt: null,
          createdAt: "2024-01-01",
        },
      ],
    });

    const { result } = renderHook(() => useIntegrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  it("disconnects active providers", async () => {
    (api as jest.Mock)
      .mockResolvedValueOnce({
        items: [
          {
            id: "i1",
            provider: "gmail",
            status: "active",
            scope: null,
            lastPolledAt: null,
            createdAt: "2024-01-01",
          },
        ],
      })
      .mockResolvedValue({});

    const { result } = renderHook(() => useIntegrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await result.current.disconnectProviders(["gmail"]);
    });

    expect(api).toHaveBeenCalledWith("/api/integrations/i1", {
      method: "DELETE",
    });
  });
});
