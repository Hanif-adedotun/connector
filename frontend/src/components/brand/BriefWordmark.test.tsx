/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { BriefWordmark } from "./BriefWordmark";
import { APP_DOMAIN, APP_NAME } from "@/lib/brand";

describe("BriefWordmark", () => {
  it("always renders the product name", () => {
    render(<BriefWordmark />);
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
  });

  it("renders domain when showDomain is true", () => {
    render(<BriefWordmark showDomain />);
    expect(screen.getByText(APP_DOMAIN)).toBeInTheDocument();
  });

  it("wraps in link when href provided", () => {
    render(<BriefWordmark href="/dashboard" showDomain />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard");
  });

  it("renders icon when showIcon is true", () => {
    const { container } = render(<BriefWordmark showIcon showDomain />);
    expect(container.querySelector("img")).toBeTruthy();
  });
});
