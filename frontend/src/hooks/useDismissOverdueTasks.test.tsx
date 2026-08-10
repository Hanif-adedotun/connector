/** @jest-environment jsdom */

jest.mock("../lib/api-client", () => ({
  api: jest.fn(),
}));

import { renderHook, waitFor, act } from "@testing-library/react";
import { useDismissOverdueTasks } from "./useDismissOverdueTasks";
import { api } from "../lib/api-client";
import { createTestQueryClient, createWrapper } from "../__tests__/helpers/wrapper";
import { queryKeys } from "../lib/query-keys";
import type { FeedItem, FeedResponse } from "../types";

function feedItem(
  id: string,
  dueDate: string | null,
): FeedItem {
  return {
    id,
    source: "gmail",
    task: id,
    summary: null,
    dueDate,
    confidence: 1,
    status: "open",
    createdAt: "2024-06-15",
    sourceUrl: null,
    contextLine: null,
    groupLabel: null,
  };
}

describe("useDismissOverdueTasks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-15T15:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("optimistically removes overdue items from feed cache", async () => {
    const client = createTestQueryClient();
    const feed: FeedResponse = {
      date: "2024-06-15",
      items: [
        feedItem("overdue", "2024-06-14T12:00:00.000Z"),
        feedItem("today", "2024-06-15T18:00:00.000Z"),
        feedItem("none", null),
      ],
    };
    client.setQueryData(queryKeys.feed, feed);
    (api as jest.Mock).mockResolvedValue({
      dismissedCount: 1,
      ids: ["overdue"],
    });

    const { result } = renderHook(() => useDismissOverdueTasks(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.dismissOverdue();
    });

    await waitFor(() => {
      const updated = client.getQueryData<FeedResponse>(queryKeys.feed);
      expect(updated?.items.map((i) => i.id)).toEqual(["today", "none"]);
    });

    expect(api).toHaveBeenCalledWith(
      "/api/integrations/tasks/dismiss-overdue",
      { method: "POST" },
    );
  });
});
