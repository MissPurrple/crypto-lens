import { describe, it, expect } from "vitest";

// Re-implement the client-side URL validator for testing
// (mirrors the isValidHttpUrl function in AnalyzePage.tsx)
function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

describe("isValidHttpUrl", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("https://example.com/path?q=1")).toBe(true);
    expect(isValidHttpUrl("https://sub.domain.example.com")).toBe(true);
  });

  it("accepts valid HTTP URLs", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects non-HTTP protocols", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
    expect(isValidHttpUrl("://missing-protocol")).toBe(false);
  });

  it("rejects URLs without scheme", () => {
    expect(isValidHttpUrl("example.com")).toBe(false);
    expect(isValidHttpUrl("www.example.com")).toBe(false);
  });
});
