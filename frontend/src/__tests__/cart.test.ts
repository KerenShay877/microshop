import { describe, it, expect, beforeEach } from "vitest";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("microshop-cart");
  return stored ? JSON.parse(stored) : [];
}

function addToCart(item: CartItem): void {
  const items = getCart();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  localStorage.setItem("microshop-cart", JSON.stringify(items));
}

function removeFromCart(productId: string): void {
  const items = getCart().filter((i) => i.productId !== productId);
  localStorage.setItem("microshop-cart", JSON.stringify(items));
}

function updateQuantity(productId: string, delta: number): void {
  const items = getCart()
    .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
    .filter((i) => i.quantity > 0);
  localStorage.setItem("microshop-cart", JSON.stringify(items));
}

function getCartTotal(): number {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

describe("Cart Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should start with an empty cart", () => {
    expect(getCart()).toEqual([]);
  });

  it("should add items to cart", () => {
    addToCart({ productId: "p1", name: "Test Product", price: 29.99, quantity: 1 });
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].name).toBe("Test Product");
  });

  it("should increment quantity for existing items", () => {
    addToCart({ productId: "p1", name: "Test", price: 10, quantity: 1 });
    addToCart({ productId: "p1", name: "Test", price: 10, quantity: 1 });
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("should remove items from cart", () => {
    addToCart({ productId: "p1", name: "Test", price: 10, quantity: 1 });
    addToCart({ productId: "p2", name: "Test 2", price: 20, quantity: 1 });
    removeFromCart("p1");
    expect(getCart()).toHaveLength(1);
    expect(getCart()[0].productId).toBe("p2");
  });

  it("should update quantity with delta", () => {
    addToCart({ productId: "p1", name: "Test", price: 10, quantity: 3 });
    updateQuantity("p1", 1);
    expect(getCart()[0].quantity).toBe(4);
    updateQuantity("p1", -2);
    expect(getCart()[0].quantity).toBe(2);
  });

  it("should remove item when quantity reaches 0", () => {
    addToCart({ productId: "p1", name: "Test", price: 10, quantity: 1 });
    updateQuantity("p1", -1);
    expect(getCart()).toHaveLength(0);
  });

  it("should calculate cart total", () => {
    addToCart({ productId: "p1", name: "Item 1", price: 10, quantity: 2 });
    addToCart({ productId: "p2", name: "Item 2", price: 15.50, quantity: 1 });
    expect(getCartTotal()).toBe(35.5);
  });
});

describe("Product Price Formatting", () => {
  it("should format prices to 2 decimal places", () => {
    expect((19.9).toFixed(2)).toBe("19.90");
    expect((0).toFixed(2)).toBe("0.00");
    expect((99.999).toFixed(2)).toBe("100.00");
  });
});
