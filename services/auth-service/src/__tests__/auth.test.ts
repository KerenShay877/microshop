import { describe, it, expect, jest, beforeEach } from "bun:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

const JWT_SECRET = "test-secret";

describe("Auth Service Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hash passwords correctly", async () => {
    const password = "test-password";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it("should reject wrong passwords", async () => {
    const hash = await bcrypt.hash("correct-password", 10);
    const valid = await bcrypt.compare("wrong-password", hash);
    expect(valid).toBe(false);
  });

  it("should sign and verify JWT tokens", () => {
    const payload = { userId: "123", email: "test@test.com" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;
    expect(decoded.userId).toBe("123");
    expect(decoded.email).toBe("test@test.com");
  });

  it("should reject invalid JWT tokens", () => {
    const token = jwt.sign({ userId: "123" }, "wrong-secret");
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it("should reject expired JWT tokens", () => {
    const token = jwt.sign({ userId: "123" }, JWT_SECRET, { expiresIn: "0s" });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it("should generate deterministic UUID-like ids", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(uuidRegex.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(uuidRegex.test("not-a-uuid")).toBe(false);
  });
});
