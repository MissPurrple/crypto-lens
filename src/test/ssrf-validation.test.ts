import { describe, it, expect } from "vitest";

// Re-implement the server-side SSRF validators for testing
// (mirrors the functions in xray-analyze/index.ts)

function isPrivateHostname(hostname: string): boolean {
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "[::1]",
    "metadata.google.internal",
    "169.254.169.254",
  ];
  if (blocked.includes(hostname.toLowerCase())) return true;

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }

  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal") ||
    lowerHost.endsWith(".corp") ||
    lowerHost.endsWith(".lan")
  ) {
    return true;
  }

  return false;
}

function validateFetchUrl(rawUrl: string): URL {
  if (rawUrl.length > 2048) {
    throw new Error("URL exceeds maximum length");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new Error("URLs pointing to private or internal networks are not allowed");
  }

  if (parsed.port && !["80", "443", ""].includes(parsed.port)) {
    throw new Error("Only standard HTTP/HTTPS ports are allowed");
  }

  return parsed;
}

describe("isPrivateHostname", () => {
  it("blocks localhost variants", () => {
    expect(isPrivateHostname("localhost")).toBe(true);
    expect(isPrivateHostname("127.0.0.1")).toBe(true);
    expect(isPrivateHostname("0.0.0.0")).toBe(true);
    expect(isPrivateHostname("[::1]")).toBe(true);
  });

  it("blocks cloud metadata endpoints", () => {
    expect(isPrivateHostname("169.254.169.254")).toBe(true);
    expect(isPrivateHostname("metadata.google.internal")).toBe(true);
  });

  it("blocks private IP ranges", () => {
    // 10.x.x.x
    expect(isPrivateHostname("10.0.0.1")).toBe(true);
    expect(isPrivateHostname("10.255.255.255")).toBe(true);

    // 172.16-31.x.x
    expect(isPrivateHostname("172.16.0.1")).toBe(true);
    expect(isPrivateHostname("172.31.255.255")).toBe(true);
    expect(isPrivateHostname("172.15.0.1")).toBe(false); // just outside range
    expect(isPrivateHostname("172.32.0.1")).toBe(false);

    // 192.168.x.x
    expect(isPrivateHostname("192.168.1.1")).toBe(true);
    expect(isPrivateHostname("192.168.0.0")).toBe(true);
    expect(isPrivateHostname("192.167.1.1")).toBe(false);
  });

  it("blocks internal TLDs", () => {
    expect(isPrivateHostname("server.local")).toBe(true);
    expect(isPrivateHostname("db.internal")).toBe(true);
    expect(isPrivateHostname("app.corp")).toBe(true);
    expect(isPrivateHostname("device.lan")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isPrivateHostname("example.com")).toBe(false);
    expect(isPrivateHostname("8.8.8.8")).toBe(false);
    expect(isPrivateHostname("github.com")).toBe(false);
    expect(isPrivateHostname("1.2.3.4")).toBe(false);
  });
});

describe("validateFetchUrl", () => {
  it("accepts valid public HTTPS URLs", () => {
    const url = validateFetchUrl("https://example.com/doc.pdf");
    expect(url.hostname).toBe("example.com");
  });

  it("accepts valid public HTTP URLs", () => {
    const url = validateFetchUrl("http://example.com");
    expect(url.protocol).toBe("http:");
  });

  it("rejects non-HTTP schemes", () => {
    expect(() => validateFetchUrl("ftp://example.com")).toThrow("Only HTTP and HTTPS");
    expect(() => validateFetchUrl("file:///etc/passwd")).toThrow("Only HTTP and HTTPS");
    expect(() => validateFetchUrl("javascript:alert(1)")).toThrow("Only HTTP and HTTPS");
  });

  it("rejects URLs with credentials", () => {
    expect(() => validateFetchUrl("https://user:pass@example.com")).toThrow("credentials");
    expect(() => validateFetchUrl("https://admin@example.com")).toThrow("credentials");
  });

  it("rejects private network URLs", () => {
    expect(() => validateFetchUrl("https://localhost")).toThrow("private");
    expect(() => validateFetchUrl("https://127.0.0.1")).toThrow("private");
    expect(() => validateFetchUrl("https://10.0.0.1")).toThrow("private");
    expect(() => validateFetchUrl("https://192.168.1.1")).toThrow("private");
    expect(() => validateFetchUrl("https://169.254.169.254")).toThrow("private");
  });

  it("rejects non-standard ports", () => {
    expect(() => validateFetchUrl("https://example.com:8080")).toThrow("standard");
    expect(() => validateFetchUrl("https://example.com:3000")).toThrow("standard");
  });

  it("allows standard ports", () => {
    expect(() => validateFetchUrl("https://example.com:443")).not.toThrow();
    expect(() => validateFetchUrl("http://example.com:80")).not.toThrow();
  });

  it("rejects overly long URLs", () => {
    const longUrl = "https://example.com/" + "a".repeat(2100);
    expect(() => validateFetchUrl(longUrl)).toThrow("maximum length");
  });

  it("rejects invalid URL formats", () => {
    expect(() => validateFetchUrl("not-a-url")).toThrow("Invalid URL");
    expect(() => validateFetchUrl("")).toThrow("Invalid URL");
  });
});
