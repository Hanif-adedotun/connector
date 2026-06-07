/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { BriefWordmark } from "./BriefWordmark";
import { APP_DOMAIN } from "@/lib/brand";

describe("BriefWordmark", () => {
  it("renders domain when showDomain is true", () => {
    render(<BriefWordmark showDomain />);
    expect(screen.getByText(APP_DOMAIN)).toBeInTheDocument();
  });

  it("wraps in link when href provided", () => {
    render(<BriefWordmark href="/dashboard" showDomain />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard");
  });

  it("renders icon when showIcon is true", () => {
    render(<BriefWordmark showIcon showDomain />);
    expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
  });
});
