import { shouldSkipEmail } from "./skip-heuristics";

describe("shouldSkipEmail", () => {
  const base = {
    from: "alice@example.com",
    subject: "Project update",
    body: "Please review the doc.",
    hasListUnsubscribe: false,
  };

  it("skips noreply senders", () => {
    expect(
      shouldSkipEmail({ ...base, from: "noreply@company.com" }),
    ).toEqual({ skip: true, reason: "noreply sender" });
  });

  it("skips automated subject lines", () => {
    expect(
      shouldSkipEmail({ ...base, subject: "Out of office: away until Monday" }),
    ).toEqual({ skip: true, reason: "automated subject" });
  });

  it("skips list-unsubscribe headers", () => {
    expect(
      shouldSkipEmail({ ...base, hasListUnsubscribe: true }),
    ).toEqual({ skip: true, reason: "list-unsubscribe header" });
  });

  it("skips empty body", () => {
    expect(shouldSkipEmail({ ...base, body: "   " })).toEqual({
      skip: true,
      reason: "empty body",
    });
  });

  it("allows normal email", () => {
    expect(shouldSkipEmail(base)).toEqual({ skip: false });
  });
});
