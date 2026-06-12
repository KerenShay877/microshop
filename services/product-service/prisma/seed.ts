import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const existingCategories = await prisma.category.count();
  if (existingCategories > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Electronics" } }),
    prisma.category.create({ data: { name: "Clothing" } }),
    prisma.category.create({ data: { name: "Books" } }),
    prisma.category.create({ data: { name: "Home & Garden" } }),
    prisma.category.create({ data: { name: "Sports" } }),
  ]);

  const productsData = [
    { name: "Wireless Headphones", category: "Electronics", price: 79.99, description: "Bluetooth 5.0 noise-cancelling headphones with 30hr battery life" },
    { name: "USB-C Hub 7-in-1", category: "Electronics", price: 34.99, description: "HDMI 4K, USB 3.0 x3, SD/TF card reader, PD 100W charging" },
    { name: "Mechanical Keyboard", category: "Electronics", price: 129.99, description: "Hot-swappable RGB mechanical keyboard with Cherry MX switches" },
    { name: "27\" 4K Monitor", category: "Electronics", price: 449.99, description: "IPS panel, 99% sRGB, USB-C with 65W PD" },
    { name: "Smart Watch Pro", category: "Electronics", price: 249.99, description: "GPS, heart rate, SpO2, 14-day battery life" },
    { name: "Portable Speaker", category: "Electronics", price: 59.99, description: "IPX7 waterproof, 20hr playtime, Bluetooth 5.3" },
    { name: "Webcam 4K", category: "Electronics", price: 89.99, description: "Auto-focus, built-in ring light, noise-cancelling mic" },
    { name: "Cotton T-Shirt", category: "Clothing", price: 19.99, description: "Premium 100% organic cotton, crew neck, 6 colors" },
    { name: "Slim Fit Chinos", category: "Clothing", price: 44.99, description: "Stretch cotton chinos, tailored fit, 4 colors" },
    { name: "Denim Jacket", category: "Clothing", price: 79.99, description: "Classic denim jacket with button front and chest pockets" },
    { name: "Running Shoes", category: "Clothing", price: 119.99, description: "Lightweight mesh upper, responsive cushioning, wide sizes" },
    { name: "Winter Parka", category: "Clothing", price: 149.99, description: "Waterproof, insulated, removable hood, -20°C rated" },
    { name: "Merino Wool Sweater", category: "Clothing", price: 69.99, description: "Fine merino wool, crew neck, machine washable" },
    { name: "TypeScript Design Patterns", category: "Books", price: 44.99, description: "Practical design patterns for TypeScript developers" },
    { name: "System Design Interview", category: "Books", price: 39.99, description: "An insider's guide to system design interviews at FAANG" },
    { name: "Clean Architecture", category: "Books", price: 34.99, description: "Robert C. Martin's guide to software architecture" },
    { name: "Distributed Systems", category: "Books", price: 54.99, description: "Concepts and design of distributed systems, 3rd edition" },
    { name: "Database Internals", category: "Books", price: 49.99, description: "Deep dive into how distributed storage systems work" },
    { name: "Ceramic Plant Pot Set", category: "Home & Garden", price: 29.99, description: "Set of 3 ceramic pots with drainage, 4\", 6\", 8\"" },
    { name: "LED Desk Lamp", category: "Home & Garden", price: 39.99, description: "Adjustable color temp, USB charging, touch control" },
    { name: "Scented Candle Collection", category: "Home & Garden", price: 24.99, description: "Set of 4 soy wax candles, 40hr burn time each" },
    { name: "Throw Blanket", category: "Home & Garden", price: 34.99, description: "Ultra-soft microfiber, 50\"x70\", 8 colors available" },
    { name: "Wall Shelf Set", category: "Home & Garden", price: 44.99, description: "Set of 3 floating shelves, solid pine, 24\" each" },
    { name: "Yoga Mat Premium", category: "Sports", price: 39.99, description: "6mm thick, non-slip, eco-friendly TPE, with carry strap" },
    { name: "Adjustable Dumbbells", category: "Sports", price: 199.99, description: "2.5-24kg per dumbbell, space-saving rack included" },
    { name: "Resistance Bands Set", category: "Sports", price: 14.99, description: "5 bands from 10-50lbs, door anchor, carry bag" },
    { name: "Foam Roller", category: "Sports", price: 22.99, description: "High-density EVA foam, 18\" length, muscle recovery" },
    { name: "Jump Rope Speed", category: "Sports", price: 12.99, description: "Ball bearing system, adjustable 10ft cable, foam handles" },
    { name: "Insulated Water Bottle", category: "Sports", price: 24.99, description: "32oz, double-wall vacuum, keeps cold 24hrs / hot 12hrs" },
    { name: "Yoga Block Set", category: "Sports", price: 9.99, description: "Set of 2 high-density EVA blocks, non-slip surface" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    categoryMap[cat.name] = cat.id;
  }

  for (const p of productsData) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: categoryMap[p.category],
        stock: Math.floor(Math.random() * 100) + 10,
      },
    });
  }

  console.log(`Seeded ${productsData.length} products across ${categories.length} categories`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
