import { decrypt, encrypt, generateEncryptionKey } from "./encryption";

describe("encryption", () => {
  it("round-trips encrypt/decrypt", () => {
    const plaintext = "secret-oauth-token-12345";
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("generates 64-char hex key", () => {
    const key = generateEncryptionKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different ciphertext for same plaintext", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toBe(b);
  });
});
