/** @jest-environment jsdom */

jest.mock("../lib/api-client", () => ({
  api: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { fetchFeed, useFeed } from "./useFeed";
import { api } from "../lib/api-client";
import { createWrapper } from "../__tests__/helpers/wrapper";

describe("useFeed", () => {
  it("fetchFeed calls api", async () => {
    (api as jest.Mock).mockResolvedValue({ date: "2024-01-01", items: [] });
    const feed = await fetchFeed();
    expect(feed.items).toEqual([]);
  });

  it("loads feed data", async () => {
    (api as jest.Mock).mockResolvedValue({
      date: "2024-01-01",
      items: [{ id: "1", task: "Do thing" }],
    });

    const { result } = renderHook(() => useFeed(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data?.items).toHaveLength(1);
  });
});
