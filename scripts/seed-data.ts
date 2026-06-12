const CATEGORIES = [
  "Electronics", "Clothing", "Books", "Home & Garden", "Sports",
];

const PRODUCTS = [
  { name: "Wireless Headphones", category: "Electronics", price: 79.99, description: "Bluetooth 5.0 noise-cancelling headphones" },
  { name: "USB-C Hub", category: "Electronics", price: 34.99, description: "7-in-1 USB-C hub with HDMI, USB 3.0, SD card" },
  { name: "Cotton T-Shirt", category: "Clothing", price: 19.99, description: "Premium cotton crew neck t-shirt" },
  { name: "Denim Jeans", category: "Clothing", price: 49.99, description: "Classic straight-fit denim jeans" },
  { name: "TypeScript Handbook", category: "Books", price: 39.99, description: "Comprehensive guide to TypeScript" },
  { name: "Design Patterns", category: "Books", price: 44.99, description: "Gang of Four design patterns explained" },
  { name: "Indoor Plant Pot", category: "Home & Garden", price: 24.99, description: "Ceramic plant pot with drainage" },
  { name: "LED Desk Lamp", category: "Home & Garden", price: 39.99, description: "Adjustable LED desk lamp with USB charging" },
  { name: "Yoga Mat", category: "Sports", price: 29.99, description: "Non-slip eco-friendly yoga mat" },
  { name: "Resistance Bands", category: "Sports", price: 14.99, description: "Set of 5 resistance bands" },
  { name: "Smart Watch", category: "Electronics", price: 199.99, description: "Fitness tracker with heart rate monitor" },
  { name: "Winter Jacket", category: "Clothing", price: 89.99, description: "Waterproof insulated winter jacket" },
  { name: "Clean Code", category: "Books", price: 34.99, description: "Robert C. Martin's software craftsmanship" },
  { name: "Scented Candle Set", category: "Home & Garden", price: 18.99, description: "Set of 3 soy wax candles" },
  { name: "Dumbbell Set", category: "Sports", price: 59.99, description: "Adjustable dumbbells 2-20kg" },
];

async function seed() {
  console.log("Seeding data...");
  for (const product of PRODUCTS) {
    console.log(`  - ${product.name} (${product.category}) - $${product.price}`);
  }
  console.log(`\nTotal: ${PRODUCTS.length} products across ${CATEGORIES.length} categories`);
}

seed().catch(console.error);
