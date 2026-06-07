import { preprocessEmailBody } from "./preprocess";

describe("preprocessEmailBody", () => {
  it("strips quoted reply blocks", () => {
    const body = "Thanks!\n\nOn Mon, Jan 1 wrote:\n> old text";
    expect(preprocessEmailBody(body)).toBe("Thanks!");
  });

  it("strips original message separator", () => {
    const body = "New content\n-----Original Message-----\nOld thread";
    expect(preprocessEmailBody(body)).toBe("New content");
  });

  it("removes quoted lines", () => {
    const body = "Hello\n> quoted line\nMore";
    expect(preprocessEmailBody(body)).toBe("Hello\n\nMore");
  });

  it("removes signature after --", () => {
    const body = "Main text\n--\nSent from my phone";
    expect(preprocessEmailBody(body)).toBe("Main text");
  });

  it("truncates long bodies", () => {
    const body = "x".repeat(5000);
    expect(preprocessEmailBody(body).length).toBe(4000);
  });
});
