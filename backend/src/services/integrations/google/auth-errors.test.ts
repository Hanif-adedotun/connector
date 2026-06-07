import {
  isInvalidGrantError,
  markGoogleAuthError,
  handleGooglePollError,
} from "./auth-errors";

jest.mock("../../../models/integration.model", () => ({
  IntegrationModel: {
    findActive: jest.fn(),
    markError: jest.fn(),
  },
}));

jest.mock("../../../utils/logger", () => ({
  logger: { warn: jest.fn() },
}));

import { IntegrationModel } from "../../../models/integration.model";

describe("isInvalidGrantError", () => {
  it("detects message invalid_grant", () => {
    expect(isInvalidGrantError({ message: "invalid_grant" })).toBe(true);
  });

  it("detects response data invalid_grant", () => {
    expect(
      isInvalidGrantError({
        response: { data: { error: "invalid_grant" } },
      }),
    ).toBe(true);
  });

  it("detects expired or revoked description", () => {
    expect(
      isInvalidGrantError({
        response: {
          data: { error_description: "Token has been expired or revoked" },
        },
      }),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isInvalidGrantError(new Error("network"))).toBe(false);
    expect(isInvalidGrantError(null)).toBe(false);
  });
});

describe("markGoogleAuthError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks active google integrations as error", async () => {
    (IntegrationModel.findActive as jest.Mock)
      .mockResolvedValueOnce({ id: "int-1", status: "active" })
      .mockResolvedValueOnce(null);

    await markGoogleAuthError("user-1");

    expect(IntegrationModel.markError).toHaveBeenCalledWith("int-1");
    expect(IntegrationModel.markError).toHaveBeenCalledTimes(1);
  });
});

describe("handleGooglePollError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (IntegrationModel.findActive as jest.Mock).mockResolvedValue({
      id: "int-1",
      status: "active",
    });
  });

  it("returns false for non invalid_grant errors", async () => {
    expect(
      await handleGooglePollError("u1", "int-1", "gmail", new Error("fail")),
    ).toBe(false);
  });

  it("handles invalid_grant and marks error", async () => {
    const handled = await handleGooglePollError(
      "u1",
      "int-1",
      "gmail",
      { message: "invalid_grant" },
    );
    expect(handled).toBe(true);
    expect(IntegrationModel.markError).toHaveBeenCalled();
  });
});
