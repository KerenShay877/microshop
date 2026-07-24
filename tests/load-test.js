import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "10s", target: 10 },   // ramp up
    { duration: "20s", target: 50 },   // sustained load
    { duration: "10s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // 1. Browse products
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    "products status 200": (r) => r.status === 200,
    "products < 200ms": (r) => r.timings.duration < 200,
  });

  // 2. Browse categories
  const catsRes = http.get(`${BASE_URL}/api/categories`);
  check(catsRes, {
    "categories status 200": (r) => r.status === 200,
  });

  // 3. View single product
  if (productsRes.status === 200) {
    const products = productsRes.json();
    if (products.length > 0) {
      const prodRes = http.get(`${BASE_URL}/api/products/${products[0].id}`);
      check(prodRes, {
        "product detail 200": (r) => r.status === 200,
      });
    }
  }

  // 4. Register + Login + Create order (auth flow)
  const email = `loadtest${Date.now()}${__VU}@test.com`;
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email,
    password: "testpass123",
    name: "Load Tester",
  }), { headers: { "Content-Type": "application/json" } });

  if (registerRes.status === 201) {
    const token = registerRes.json("token");
    const authHeaders = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    // Create order
    const orderRes = http.post(`${BASE_URL}/api/orders`, JSON.stringify({
      items: [{ productId: "test", quantity: 1 }],
    }), authHeaders);

    check(orderRes, {
      "order created": (r) => r.status === 201 || r.status === 400,
    });
  }

  sleep(1);
}
