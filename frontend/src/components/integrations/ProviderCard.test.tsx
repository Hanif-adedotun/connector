/** @jest-environment jsdom */

jest.mock("../../lib/api-client", () => ({
  getOAuthStartUrl: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProviderCard } from "./ProviderCard";
import { getOAuthStartUrl } from "../../lib/api-client";

describe("ProviderCard", () => {
  it("shows connect button when disconnected", () => {
    render(
      <ProviderCard
        id="google"
        label="Google"
        icon={<span>G</span>}
        description="Calendar and Gmail"
        connected={false}
      />,
    );
    expect(screen.getByRole("button", { name: /Connect/i })).toBeInTheDocument();
  });

  it("shows disconnect when connected", () => {
    render(
      <ProviderCard
        id="slack"
        label="Slack"
        icon={<span>S</span>}
        description="Messages"
        connected
        onDisconnect={jest.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Disconnect/i })).toBeInTheDocument();
  });

  it("shows coming soon state", () => {
    render(
      <ProviderCard
        id="discord"
        label="Discord"
        icon={<span>D</span>}
        description="Coming"
        connected={false}
        comingSoon
      />,
    );
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
  });

  it("shows error on connect failure", async () => {
    (getOAuthStartUrl as jest.Mock).mockRejectedValue({
      message: "OAuth failed",
    });
    const user = userEvent.setup();
    render(
      <ProviderCard
        id="google"
        label="Google"
        icon={<span>G</span>}
        description="Calendar"
        connected={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Connect/i }));
    expect(await screen.findByText("OAuth failed")).toBeInTheDocument();
  });
});
