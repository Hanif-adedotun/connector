/** @jest-environment jsdom */

jest.mock("../lib/api-client", () => ({
  api: jest.fn(),
}));

import { renderHook, waitFor, act } from "@testing-library/react";
import { useDismissTask } from "./useDismissTask";
import { api } from "../lib/api-client";
import { createTestQueryClient, createWrapper } from "../__tests__/helpers/wrapper";
import { queryKeys } from "../lib/query-keys";
import type { FeedResponse } from "../types";

describe("useDismissTask", () => {
  it("optimistically removes item from feed cache", async () => {
    const client = createTestQueryClient();
    const feed: FeedResponse = {
      date: "2024-06-01",
      items: [
        {
          id: "t1",
          source: "gmail",
          task: "Task 1",
          summary: null,
          dueDate: null,
          confidence: 1,
          status: "open",
          createdAt: "2024-06-01",
          sourceUrl: null,
          contextLine: null,
        },
        {
          id: "t2",
          source: "gmail",
          task: "Task 2",
          summary: null,
          dueDate: null,
          confidence: 1,
          status: "open",
          createdAt: "2024-06-01",
          sourceUrl: null,
          contextLine: null,
        },
      ],
    };
    client.setQueryData(queryKeys.feed, feed);
    (api as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useDismissTask(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.dismiss("t1");
    });

    await waitFor(() => {
      const updated = client.getQueryData<FeedResponse>(queryKeys.feed);
      expect(updated?.items).toHaveLength(1);
      expect(updated?.items[0].id).toBe("t2");
    });
  });
});
