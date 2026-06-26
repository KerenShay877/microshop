import { describe, it, expect } from "vitest";

enum EventType {
  ORDER_CREATED = "order.created",
  INVENTORY_RESERVED = "inventory.reserved",
  INVENTORY_RESERVATION_FAILED = "inventory.reservation.failed",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",
  ORDER_CONFIRMED = "order.confirmed",
  ORDER_CANCELLED = "order.cancelled",
}

interface OrderEvent {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: string;
}

function createOrderEvent(type: EventType, data: Record<string, unknown>): OrderEvent {
  return { type, data, timestamp: new Date().toISOString() };
}

function isTerminalStatus(status: string): boolean {
  return ["confirmed", "shipped", "delivered", "cancelled"].includes(status);
}

function calculateTotal(
  items: { price: number; quantity: number }[]
): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

describe("Order Event Bus", () => {
  it("should create an order created event", () => {
    const event = createOrderEvent(EventType.ORDER_CREATED, {
      orderId: "123",
      customerId: "user-1",
      items: [{ productId: "p1", quantity: 1, price: 29.99 }],
      totalAmount: 29.99,
    });
    expect(event.type).toBe("order.created");
    expect(event.data.orderId).toBe("123");
    expect(event.timestamp).toBeTruthy();
  });

  it("should maintain event type enum values", () => {
    expect(EventType.ORDER_CREATED).toBe("order.created");
    expect(EventType.INVENTORY_RESERVED).toBe("inventory.reserved");
    expect(EventType.PAYMENT_COMPLETED).toBe("payment.completed");
    expect(EventType.ORDER_CONFIRMED).toBe("order.confirmed");
    expect(EventType.ORDER_CANCELLED).toBe("order.cancelled");
  });
});

describe("Order Status", () => {
  it("should identify terminal statuses", () => {
    expect(isTerminalStatus("confirmed")).toBe(true);
    expect(isTerminalStatus("shipped")).toBe(true);
    expect(isTerminalStatus("delivered")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("")).toBe(false);
  });
});

describe("Order Calculations", () => {
  it("should calculate total from items", () => {
    const items = [
      { price: 29.99, quantity: 2 },
      { price: 49.99, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(109.97);
  });

  it("should return 0 for empty items", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("should format total to 2 decimal places", () => {
    const items = [{ price: 10.005, quantity: 1 }];
    expect(calculateTotal(items)).toBe(10.005);
    expect(calculateTotal(items).toFixed(2)).toBe("10.01");
  });
});

describe("Event Routing", () => {
  const routingKeys = ["order.*", "inventory.*", "payment.*"];

  it("should match order.created to order.* pattern", () => {
    const key = "order.created";
    const matches = routingKeys.some((pattern) => {
      const regex = new RegExp("^" + pattern.replace(".", "\\.").replace("*", ".*") + "$");
      return regex.test(key);
    });
    expect(matches).toBe(true);
  });

  it("should match payment.completed to payment.* pattern", () => {
    const key = "payment.completed";
    const matches = routingKeys.some((pattern) => {
      const regex = new RegExp("^" + pattern.replace(".", "\\.").replace("*", ".*") + "$");
      return regex.test(key);
    });
    expect(matches).toBe(true);
  });

  it("should not match product.created to any pattern", () => {
    const key = "product.created";
    const matches = routingKeys.some((pattern) => {
      const regex = new RegExp("^" + pattern.replace(".", "\\.").replace("*", ".*") + "$");
      return regex.test(key);
    });
    expect(matches).toBe(false);
  });
});
