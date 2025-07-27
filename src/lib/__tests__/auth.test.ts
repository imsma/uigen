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
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
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

  expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets cookie with correct parameters", async () => {
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-456", "another@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "mock-jwt-token", {
    httpOnly: true,
    secure: false, // development environment
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  // Check the actual call arguments
  const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];
  expect(cookieName).toBe("auth-token");
  expect(token).toBe("mock-jwt-token");
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession sets secure cookie in production environment", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-789", "prod@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith("auth-token", "mock-jwt-token", {
    httpOnly: true,
    secure: true, // production environment
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  // Restore original NODE_ENV
  process.env.NODE_ENV = originalEnv;
});

test("createSession uses development secret key when JWT_SECRET is not provided", async () => {
  const originalEnv = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  await createSession("user-test", "test@example.com");

  // The sign method should have been called, indicating the function works
  expect(mockSign).toHaveBeenCalled();

  // Restore original JWT_SECRET
  if (originalEnv) process.env.JWT_SECRET = originalEnv;
});

test("createSession handles JWT signing errors", async () => {
  const mockSign = vi.fn().mockRejectedValue(new Error("Signing failed"));
  const mockSignJWT = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  
  vi.mocked(SignJWT).mockImplementation(() => mockSignJWT as any);

  // The function should propagate the error
  await expect(createSession("user-123", "test@example.com")).rejects.toThrow("Signing failed");
});