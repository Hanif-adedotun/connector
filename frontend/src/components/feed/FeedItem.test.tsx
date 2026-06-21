/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { FeedItem } from "./FeedItem";
import type { FeedItem as FeedItemType } from "@/types";

const baseItem: FeedItemType = {
  id: "1",
  source: "gmail",
  task: "Review doc",
  summary: "Please review",
  dueDate: null,
  confidence: 0.9,
  status: "open",
  createdAt: "2024-06-01",
  sourceUrl: null,
  contextLine: null,
};

describe("FeedItem", () => {
  it("renders task text", () => {
    render(<FeedItem item={baseItem} onDismiss={jest.fn()} />);
    expect(screen.getByText("Review doc")).toBeInTheDocument();
    expect(screen.getByText("Please review")).toBeInTheDocument();
  });

  it("renders source link when sourceUrl present", () => {
    render(
      <FeedItem
        item={{ ...baseItem, sourceUrl: "https://mail.google.com/m/1" }}
        onDismiss={jest.fn()}
      />,
    );
    const link = screen.getByRole("link", { name: "Review doc" });
    expect(link).toHaveAttribute("href", "https://mail.google.com/m/1");
  });

  it("shows overdue badge for past due dates", () => {
    render(
      <FeedItem
        item={{
          ...baseItem,
          dueDate: new Date(2000, 0, 1).toISOString(),
        }}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it("shows Slack context line below title", () => {
    render(
      <FeedItem
        item={{
          ...baseItem,
          source: "slack",
          task: "Follow up with him",
          summary: "Needs a response",
          contextLine: "#general · from Alex · Acme",
        }}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByText("Follow up with him")).toBeInTheDocument();
    expect(
      screen.getByText("#general · from Alex · Acme"),
    ).toBeInTheDocument();
    expect(screen.getByText("Needs a response")).toBeInTheDocument();
  });

  it("hides Slack context line when absent", () => {
    render(
      <FeedItem
        item={{
          ...baseItem,
          source: "slack",
          contextLine: null,
        }}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.queryByText(/from Alex/)).not.toBeInTheDocument();
  });

  it("includes a desktop dismiss control", () => {
    render(<FeedItem item={baseItem} onDismiss={jest.fn()} />);
    expect(
      screen.getByRole("button", { name: "Dismiss task" }),
    ).toBeInTheDocument();
  });
});
