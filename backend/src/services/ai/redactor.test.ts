import { redact } from "./redactor";

describe("redact", () => {
  it("redacts AWS access keys", () => {
    const text = "key is AKIAIOSFODNN7EXAMPLE here";
    expect(redact(text)).toContain("[REDACTED_AWS_KEY]");
    expect(redact(text)).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts bearer tokens", () => {
    const text = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9";
    expect(redact(text)).toBe("Authorization: Bearer [REDACTED]");
  });

  it("redacts JWT tokens", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(redact(`token ${jwt}`)).not.toContain(jwt);
    expect(redact(`token ${jwt}`)).toContain("[REDACTED_JWT]");
  });

  it("redacts api keys", () => {
    const text = 'api_key="abcdefghijklmnopqrstuvwxyz"';
    expect(redact(text)).toContain("api_key=[REDACTED]");
  });

  it("leaves safe text unchanged", () => {
    expect(redact("Hello, please review the doc.")).toBe(
      "Hello, please review the doc.",
    );
  });
});
