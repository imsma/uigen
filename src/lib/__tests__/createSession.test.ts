import { test, expect, vi, beforeEach } from "vitest";

// Mock server-only module to avoid client-side errors
vi.mock("server-only", () => ({}));

// Import after mocking
import { createSession } from "../auth";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(),
}));

const mockCookieStore = {
  set: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
});

test("createSession creates JWT token with correct payload structure", async () => {
  const mockSign = vi.fn().mockResolvedValue("test-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-123", "test@example.com");

  expect(SignJWT).toHaveBeenCalledWith({
    userId: "user-123",
    email: "test@example.com",
    expiresAt: expect.any(Date),
  });
});

test("createSession configures JWT with proper settings", async () => {
  const mockSign = vi.fn().mockResolvedValue("test-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-456", "user@example.com");

  expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets cookie with correct configuration", async () => {
  const mockSign = vi.fn().mockResolvedValue("test-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-789", "cookie@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "test-token", {
    httpOnly: true,
    secure: false, // development environment
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });
});

test("createSession uses secure cookie in production environment", async () => {
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

  await createSession("user-prod", "prod@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "prod-token", {
    httpOnly: true,
    secure: true, // production mode
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  process.env.NODE_ENV = originalEnv;
});

test("createSession uses development secret when JWT_SECRET is missing", async () => {
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

test("createSession handles JWT signing errors appropriately", async () => {
  const mockSign = vi.fn().mockRejectedValue(new Error("JWT signing failed"));
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await expect(createSession("user-err", "error@example.com")).rejects.toThrow("JWT signing failed");
});

test("createSession sets 7-day expiration on cookie", async () => {
  const mockSign = vi.fn().mockResolvedValue("token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-exp", "exp@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.expires).toBeInstanceOf(Date);
  
  // Verify it's approximately 7 days from now (allowing 1 second tolerance)
  const expectedMs = 7 * 24 * 60 * 60 * 1000;
  const actualMs = options.expires.getTime() - Date.now();
  expect(actualMs).toBeGreaterThan(expectedMs - 1000);
  expect(actualMs).toBeLessThan(expectedMs + 1000);
});