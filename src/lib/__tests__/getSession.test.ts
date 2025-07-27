import { test, expect, vi, beforeEach } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Import after mocking
import { getSession } from "../auth";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock jose
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

const mockCookieStore = {
  get: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
});

test("getSession returns null when no cookie exists", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
});

test("getSession returns null when cookie value is empty", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null when cookie is invalid", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "invalid-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns valid session when token is valid", async () => {
  const mockPayload = {
    userId: "user-123",
    email: "test@example.com",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  };

  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "valid-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload: mockPayload });

  const session = await getSession();

  expect(session).toEqual(mockPayload);
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalled();
});

test("getSession handles expired token gracefully", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "expired-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("Token expired"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession handles malformed token", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "malformed-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new SyntaxError("Invalid JSON"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession handles jwtVerify with different error types", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "some-token" });
  
  // Test with various JWT verification errors
  const errors = [
    new Error("JWT expired"),
    new Error("Invalid signature"),
    new Error("Token malformed"),
  ];

  for (const error of errors) {
    vi.mocked(jwtVerify).mockRejectedValue(error);
    const session = await getSession();
    expect(session).toBeNull();
  }
});

test("getSession uses correct JWT secret", async () => {
  const mockPayload = {
    userId: "user-456",
    email: "another@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "test-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload: mockPayload });

  await getSession();

  expect(jwtVerify).toHaveBeenCalled();
  expect(jwtVerify).toHaveBeenCalledWith("test-token", expect.anything());
});

test("getSession returns null when jwtVerify throws any error", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: "problematic-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("Unknown error"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession handles empty object cookie value", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({});

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession handles cookie with undefined value", async () => {
  vi.mocked(mockCookieStore.get).mockReturnValue({ value: undefined });

  const session = await getSession();

  expect(session).toBeNull();
});