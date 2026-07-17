import { describe, it, expect } from "bun:test";
import { formatEmail } from "../email";

describe("formatEmail", () => {
  it("returns null for unknown event type", () => {
    const result = formatEmail("unknown.event", {});
    expect(result).toBeNull();
  });

  it("formats order.created email", () => {
    const result = formatEmail("order.created", {
      orderId: "ord-123",
      totalAmount: 79.99,
      items: [{ productId: "p1", quantity: 1, price: 79.99 }],
    });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe("Order #ord-123 Placed Successfully");
    expect(result!.text).toContain("$79.99");
    expect(result!.text).toContain("ord-123");
  });

  it("formats order.confirmed email", () => {
    const result = formatEmail("order.confirmed", {
      orderId: "ord-456",
      transactionId: "txn-abc",
    });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe("Order #ord-456 Confirmed");
    expect(result!.text).toContain("txn-abc");
  });

  it("formats order.cancelled email", () => {
    const result = formatEmail("order.cancelled", {
      orderId: "ord-789",
      reason: "Out of stock",
    });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe("Order #ord-789 Cancelled");
    expect(result!.text).toContain("Out of stock");
  });

  it("formats payment.completed email", () => {
    const result = formatEmail("payment.completed", {
      orderId: "ord-999",
      amount: 49.99,
      transactionId: "txn-xyz",
    });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe("Payment Received for Order #ord-999");
    expect(result!.text).toContain("$49.99");
    expect(result!.text).toContain("txn-xyz");
  });

  it("formats payment.failed email", () => {
    const result = formatEmail("payment.failed", {
      orderId: "ord-111",
      reason: "Insufficient funds",
    });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe("Payment Failed for Order #ord-111");
    expect(result!.text).toContain("Insufficient funds");
  });

  it("handles missing optional data gracefully", () => {
    const result = formatEmail("payment.failed", { orderId: "ord-222" });
    expect(result).not.toBeNull();
    expect(result!.text).toContain("Unknown error");
  });
});
