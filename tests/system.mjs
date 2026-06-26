const BASE = "http://localhost:3000";
const SERVICES = [
  { name: "product-service", url: "http://localhost:3001" },
  { name: "order-service", url: "http://localhost:3002" },
  { name: "inventory-service", url: "http://localhost:3003" },
  { name: "payment-service", url: "http://localhost:3004" },
  { name: "notification-service", url: "http://localhost:3005" },
  { name: "auth-service", url: "http://localhost:3006" },
];

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "test-password-123";
const TEST_NAME = "Test User";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function get(url) {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

console.log("\n=== Health Checks ===\n");

for (const svc of SERVICES) {
  await test(`${svc.name} health endpoint`, async () => {
    const { status, body } = await get(`${svc.url}/health`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body.status === "ok", `Expected status ok, got ${body.status}`);
  });
}

await test("API gateway health", async () => {
  const { status, body } = await get(`${BASE}/health`);
  assert(status === 200, `Expected 200, got ${status}`);
  assert(body.status === "ok");
});

console.log("\n=== Product API ===\n");

await test("GET /api/products returns products", async () => {
  const { status, body } = await get(`${BASE}/api/products`);
  assert(status === 200, `Expected 200, got ${status}`);
  assert(Array.isArray(body), "Expected array");
  assert(body.length > 0, "Expected at least one product");
});

await test("GET /api/products includes category", async () => {
  const { body } = await get(`${BASE}/api/products`);
  assert(body[0].category, "Expected category on product");
  assert(body[0].category.name, "Expected category name");
});

await test("GET /api/products includes price", async () => {
  const { body } = await get(`${BASE}/api/products?limit=1`);
  assert(typeof body[0].price === "number", "Expected numeric price");
});

await test("GET /api/categories returns categories", async () => {
  const { status, body } = await get(`${BASE}/api/categories`);
  assert(status === 200, `Expected 200, got ${status}`);
  assert(Array.isArray(body), "Expected array");
  assert(body.length > 0, "Expected at least one category");
});

console.log("\n=== Frontend ===\n");

await test("Frontend returns 200", async () => {
  const res = await fetch("http://localhost:4000/");
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

console.log("\n=== RabbitMQ ===\n");

await test("RabbitMQ management API accessible", async () => {
  const res = await fetch("http://localhost:15672/api/overview", {
    headers: { Authorization: "Basic " + Buffer.from("guest:guest").toString("base64") },
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

console.log("\n=== Auth API ===\n");

let authToken;

await test("POST /api/auth/register creates user", async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
  });
  const data = await res.json();
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(data.token, "Expected token");
  assert(data.user.email === TEST_EMAIL, "Expected user email");
  authToken = data.token;
});

await test("POST /api/auth/login returns token", async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(data.token, "Expected token");
  authToken = data.token;
});

await test("POST /api/auth/login rejects wrong password", async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: "wrong-password" }),
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

await test("GET /api/auth/me returns user", async () => {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(data.email === TEST_EMAIL, "Expected correct email");
  assert(data.name === TEST_NAME, "Expected correct name");
});

await test("GET /api/auth/me rejects without token", async () => {
  const res = await fetch(`${BASE}/api/auth/me`);
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

console.log("\n=== Orders API ===\n");

await test("POST /api/orders creates order", async () => {
  const productsRes = await fetch(`${BASE}/api/products`);
  const products = await productsRes.json();
  assert(products.length > 0, "Need at least one product to test order");

  const product = products[0];
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      customerId: "test-user",
      items: [{ productId: product.id, name: product.name, quantity: 1, price: product.price }],
    }),
  });
  const data = await res.json();
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  assert(data.id, "Expected order id");
  assert(data.status === "pending", "Expected pending status");
});

await test("GET /api/orders returns orders", async () => {
  const res = await fetch(`${BASE}/api/orders`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(data), "Expected array");
  assert(data.length > 0, "Expected at least one order");
});

console.log("\n=== Summary ===\n");
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);
if (failed > 0) process.exit(1);
