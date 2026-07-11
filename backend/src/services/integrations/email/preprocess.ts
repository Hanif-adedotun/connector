const MAX_BODY_LENGTH = 4000;

/**
 * Strips quoted replies, signatures, and excess whitespace from email body text.
 */
export function preprocessEmailBody(body: string): string {
  let text = body;

  text = text.replace(/\nOn .+ wrote:\n[\s\S]*/i, "");
  text = text.replace(/\n-----Original Message-----[\s\S]*/i, "");
  text = text.replace(/^>.*$/gm, "");
  text = text.replace(/\n--\n[\s\S]*/m, "");
  text = text.replace(/\nSent from my iPhone[\s\S]*/i, "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  if (text.length > MAX_BODY_LENGTH) {
    text = text.slice(0, MAX_BODY_LENGTH);
  }

  return text;
}
