import { describe, it, expect } from "vitest";

interface Product {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
}

function validateProduct(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== "string") errors.push("name is required");
  if (!data.description || typeof data.description !== "string") errors.push("description is required");
  if (typeof data.price !== "number" || data.price <= 0) errors.push("price must be a positive number");
  if (!data.categoryName || typeof data.categoryName !== "string") errors.push("categoryName is required");
  return { valid: errors.length === 0, errors };
}

function filterProducts(products: Product[], search?: string, category?: string): Product[] {
  return products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.categoryName === category;
    return matchSearch && matchCategory;
  });
}

describe("Product Validation", () => {
  it("should validate a valid product", () => {
    const result = validateProduct({
      name: "Test Product",
      description: "A test product",
      price: 19.99,
      categoryName: "Electronics",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject a product missing name", () => {
    const result = validateProduct({
      description: "A test product",
      price: 19.99,
      categoryName: "Electronics",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  it("should reject a product with zero price", () => {
    const result = validateProduct({
      name: "Free Product",
      description: "Should not be free",
      price: 0,
      categoryName: "Misc",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("price must be a positive number");
  });

  it("should format price to 2 decimal places", () => {
    expect((19.9).toFixed(2)).toBe("19.90");
    expect((19.999).toFixed(2)).toBe("20.00");
    expect((0).toFixed(2)).toBe("0.00");
  });
});

describe("Product Filtering", () => {
  const products: Product[] = [
    { name: "Wireless Headphones", description: "Bluetooth headphones", price: 79.99, stock: 10, categoryName: "Electronics" },
    { name: "Cotton T-Shirt", description: "Premium organic cotton", price: 19.99, stock: 50, categoryName: "Clothing" },
    { name: "Running Shoes", description: "Lightweight running shoes", price: 119.99, stock: 5, categoryName: "Clothing" },
    { name: "USB-C Hub", description: "7-in-1 USB-C hub", price: 34.99, stock: 30, categoryName: "Electronics" },
  ];

  it("should return all products with no filters", () => {
    const result = filterProducts(products);
    expect(result).toHaveLength(4);
  });

  it("should filter by search term", () => {
    const result = filterProducts(products, "headphones");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Wireless Headphones");
  });

  it("should filter by category", () => {
    const result = filterProducts(products, undefined, "Clothing");
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.categoryName === "Clothing")).toBe(true);
  });

  it("should combine search and category filters", () => {
    const result = filterProducts(products, "running", "Clothing");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Running Shoes");
  });

  it("should be case-insensitive", () => {
    const result = filterProducts(products, "WIRELESS");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Wireless Headphones");
  });

  it("should return empty for no matches", () => {
    const result = filterProducts(products, "nonexistent");
    expect(result).toHaveLength(0);
  });
});
