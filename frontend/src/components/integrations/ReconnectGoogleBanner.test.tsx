/** @jest-environment jsdom */

jest.mock("../../lib/api-client", () => ({
  getOAuthStartUrl: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReconnectGoogleBanner } from "./ReconnectGoogleBanner";
import { getOAuthStartUrl } from "../../lib/api-client";

describe("ReconnectGoogleBanner", () => {
  it("renders reconnect message", () => {
    render(<ReconnectGoogleBanner />);
    expect(screen.getByText(/Google connection expired/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reconnect Google/i }),
    ).toBeInTheDocument();
  });

  it("shows error when reconnect fails", async () => {
    (getOAuthStartUrl as jest.Mock).mockRejectedValue({
      message: "Server error",
    });
    const user = userEvent.setup();
    render(<ReconnectGoogleBanner />);
    await user.click(screen.getByRole("button", { name: /Reconnect Google/i }));
    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });
});
