#!/bin/bash
set -euo pipefail

NAMESPACE="microshop"
BASE_URL="${1:-http://microshop.local}"
PASS=0
FAIL=0

green() { echo -e "\033[32m$1\033[0m"; }
red()   { echo -e "\033[31m$1\033[0m"; }

assert_status() {
  local desc="$1" url="$2" expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    green "  PASS: $desc (HTTP $code)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $desc (expected $expected, got $code)"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local desc="$1" url="$2" pattern="$3"
  if curl -s --max-time 5 "$url" 2>/dev/null | grep -q "$pattern"; then
    green "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $desc (expected body to contain '$pattern')"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Smoke Tests ==="

# Health endpoints
assert_status "Frontend"             "$BASE_URL/"
assert_status "API Gateway health"   "$BASE_URL/api/health"
assert_status "Products list"        "$BASE_URL/api/products"
assert_status "Auth health"          "$BASE_URL/api/auth/me" 401

# Product data
assert_contains "Products return JSON" "$BASE_URL/api/products" "id"

# Register a test user
echo ""
echo ">>> Registering test user..."
REG_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"k8s-test@example.com","password":"Test123!","name":"K8s Tester"}')
REG_TOKEN=$(echo "$REG_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$REG_TOKEN" ]; then
  green "  PASS: User registration (got token)"
  PASS=$((PASS + 1))

  # Authenticated endpoints
  assert_status "Auth me"            "$BASE_URL/api/auth/me" -H "Authorization: Bearer $REG_TOKEN"
  assert_status "Create order"       "$BASE_URL/api/orders" -X POST \
    -H "Authorization: Bearer $REG_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"productId":"1","quantity":1}],"shippingAddress":"123 Test St"}'
else
  red "  FAIL: User registration (no token)"
  FAIL=$((FAIL + 1))
fi

# Jaeger (port-forward if using minikube)
JAEGER_URL="${2:-http://localhost:16686}"
assert_status "Jaeger UI" "$JAEGER_URL" 200

echo ""
echo "=== Results ==="
green "Passed: $PASS"
if [ "$FAIL" -gt 0 ]; then
  red "Failed: $FAIL"
  exit 1
else
  echo "All tests passed!"
fi
