/** @jest-environment jsdom */

jest.mock("../../hooks/useDismissTask", () => ({
  useDismissTask: () => ({
    dismiss: jest.fn(),
    dismissingId: undefined,
  }),
}));

import { render, screen } from "@testing-library/react";
import { FeedList } from "./FeedList";
import type { FeedItem } from "@/types";

const item = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: "1",
  source: "gmail",
  task: "Review proposal",
  summary: "From Alice",
  dueDate: null,
  confidence: 0.9,
  status: "open",
  createdAt: "2024-06-01",
  sourceUrl: null,
  contextLine: null,
  ...overrides,
});

describe("FeedList", () => {
  it("shows empty state when integrations exist", () => {
    render(<FeedList items={[]} hasIntegrations />);
    expect(screen.getByText(/No tasks surfaced yet/)).toBeInTheDocument();
  });

  it("shows connect CTA when no integrations", () => {
    render(<FeedList items={[]} hasIntegrations={false} />);
    expect(
      screen.getByRole("link", { name: /add integrations/i }),
    ).toHaveAttribute("href", "/integrations");
  });

  it("groups and renders items by source", () => {
    render(
      <FeedList
        items={[
          item({ id: "1", source: "gmail", task: "Gmail task" }),
          item({ id: "2", source: "jira", task: "Jira task" }),
        ]}
      />,
    );
    expect(screen.getByText("Gmail task")).toBeInTheDocument();
    expect(screen.getByText("Jira task")).toBeInTheDocument();
    expect(screen.getByText("Gmail")).toBeInTheDocument();
    expect(screen.getByText("Jira")).toBeInTheDocument();
  });
});
