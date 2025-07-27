import { test, expect, vi, beforeEach } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Import after mocking
import { createSession } from "../auth";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(),
  })),
}));

const mockCookieStore = {
  set: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
});

test("createSession creates JWT token with correct payload", async () => {
  const mockSign = vi.fn().mockResolvedValue("test-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-123", "user@example.com");

  expect(SignJWT).toHaveBeenCalledWith({
    userId: "user-123",
    email: "user@example.com",
    expiresAt: expect.any(Date),
  });

  expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets cookie with correct configuration", async () => {
  const mockSign = vi.fn().mockResolvedValue("test-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-456", "another@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "test-jwt-token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];
  expect(cookieName).toBe("auth-token");
  expect(token).toBe("test-jwt-token");
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession uses secure cookie in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  const mockSign = vi.fn().mockResolvedValue("prod-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-789", "prod@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "prod-token", {
    httpOnly: true,
    secure: true, // production mode
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  process.env.NODE_ENV = originalEnv;
});

test("createSession uses development secret when JWT_SECRET missing", async () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  const mockSign = vi.fn().mockResolvedValue("dev-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-dev", "dev@example.com");

  expect(mockSign).toHaveBeenCalled();

  if (originalSecret) process.env.JWT_SECRET = originalSecret;
});

test("createSession propagates JWT signing errors", async () => {
  const mockSign = vi.fn().mockRejectedValue(new Error("Signing failed"));
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await expect(createSession("user-err", "error@example.com")).rejects.toThrow("Signing failed");
});