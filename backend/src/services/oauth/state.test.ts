import { BadRequestError } from "../../utils/errors";
import {
  decodeState,
  encodeState,
  integrationsRedirectUrl,
} from "./state";

describe("OAuth state", () => {
  it("round-trips encode/decode", () => {
    const payload = { userId: "user-123", provider: "google" };
    expect(decodeState(encodeState(payload))).toEqual(payload);
  });

  it("throws on invalid state", () => {
    expect(() => decodeState("not-valid")).toThrow(BadRequestError);
  });

  it("throws on missing fields", () => {
    const bad = Buffer.from(JSON.stringify({ userId: "x" })).toString(
      "base64url",
    );
    expect(() => decodeState(bad)).toThrow(BadRequestError);
  });
});

describe("integrationsRedirectUrl", () => {
  it("builds base integrations URL", () => {
    expect(integrationsRedirectUrl()).toBe(
      "http://localhost:4001/integrations",
    );
  });

  it("adds query params", () => {
    const url = integrationsRedirectUrl({
      connected: "google",
      error: "denied",
    });
    expect(url).toContain("connected=google");
    expect(url).toContain("error=denied");
  });
});
