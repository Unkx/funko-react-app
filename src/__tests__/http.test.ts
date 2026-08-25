import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authFetch, ApiError } from "../api/http";

describe("authFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches the Authorization header from localStorage and returns parsed JSON", async () => {
    localStorage.setItem("token", "abc123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ hello: "world" }),
    });
    (global as any).fetch = mockFetch;

    const result = await authFetch("/api/wishlist");

    expect(result).toEqual({ hello: "world" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer abc123");
  });

  it("throws ApiError with the status on a non-OK response", async () => {
    localStorage.setItem("token", "abc123");
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Not found" }),
    });

    await expect(authFetch("/api/wishlist/1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("passes through method/body/extra headers for mutations", async () => {
    localStorage.setItem("token", "abc123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: "1" }),
    });
    (global as any).fetch = mockFetch;

    await authFetch("/api/wishlist/1", {
      method: "PUT",
      body: JSON.stringify({ notes: "x" }),
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer abc123");
  });
});
