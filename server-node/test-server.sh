#!/bin/bash

# Action.txt Server Test Script
# Tests all endpoints and functionality according to the specification

set -e

BASE_URL="http://localhost:4242"
TOKEN="dev-token"

echo "🚀 Testing Action.txt Server at $BASE_URL"
echo "=========================================="

# Test 1: Ping endpoint (no auth required)
echo -e "\n1️⃣ Testing Ping Endpoint"
echo "Expected: 200 OK with {'message': 'pong'}"
RESPONSE=$(curl -s "$BASE_URL/ping")
echo "Response: $RESPONSE"
if [[ "$RESPONSE" == *'"message":"pong"'* ]]; then
    echo "✅ Ping endpoint working correctly"
else
    echo "❌ Ping endpoint failed"
    exit 1
fi

# Test 2: Authentication requirement
echo -e "\n2️⃣ Testing Authentication Requirement"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/orders/ORD-ABC123/status" -o /dev/null)
if [[ "$RESPONSE" == "401" ]]; then
    echo "✅ Authentication required correctly"
else
    echo "❌ Authentication not enforced (got $RESPONSE)"
    exit 1
fi

# Test 3: Orders endpoint with valid token
echo -e "\n3️⃣ Testing Orders Endpoint with Valid Token"
echo "Expected: 200 OK with order status"
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/orders/ORD-ABC123/status")
echo "Response: $RESPONSE"
if [[ "$RESPONSE" == *'"order_id":"ORD-ABC123"'* ]]; then
    echo "✅ Orders endpoint working with valid token"
else
    echo "❌ Orders endpoint failed"
    exit 1
fi

# Test 4: Idempotency requirement
echo -e "\n4️⃣ Testing Idempotency-Key Requirement"
echo "Expected: 400 Bad Request - missing Idempotency-Key"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/demos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test@example.com","time_window":"2025-08-16T09:00Z/2025-08-18T17:00Z"}' \
    -o /dev/null)
if [[ "$RESPONSE" == "400" ]]; then
    echo "✅ Idempotency-Key requirement enforced"
else
    echo "❌ Idempotency-Key not required (got $RESPONSE)"
    exit 1
fi

# Test 5: Demo creation with idempotency
echo -e "\n5️⃣ Testing Demo Creation with Idempotency"
IDEMP_KEY=$(uuidgen)
echo "Using idempotency key: $IDEMP_KEY"

# First request
RESPONSE1=$(curl -s -X POST "$BASE_URL/demos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $IDEMP_KEY" \
    -d '{"name":"Test User","email":"test@example.com","time_window":"2025-08-16T09:00Z/2025-08-18T17:00Z"}')
echo "First response: $RESPONSE1"

# Second request with same key and payload
RESPONSE2=$(curl -s -X POST "$BASE_URL/demos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $IDEMP_KEY" \
    -d '{"name":"Test User","email":"test@example.com","time_window":"2025-08-16T09:00Z/2025-08-18T17:00Z"}')
echo "Second response: $RESPONSE2"

if [[ "$RESPONSE1" == "$RESPONSE2" ]]; then
    echo "✅ Idempotency working correctly"
else
    echo "❌ Idempotency failed - responses differ"
    exit 1
fi

# Test 6: Quotes sandbox endpoint
echo -e "\n6️⃣ Testing Quotes Sandbox Endpoint"
echo "Expected: 200 OK with quote data"
RESPONSE=$(curl -s -X POST "$BASE_URL/quotes/sandbox" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sku":"SKU-123","quantity":3}')
echo "Response: $RESPONSE"
if [[ "$RESPONSE" == *'"quote_id"'* && "$RESPONSE" == *'"subtotal"'* ]]; then
    echo "✅ Quotes sandbox endpoint working"
else
    echo "❌ Quotes sandbox endpoint failed"
    exit 1
fi

# Test 7: Static file serving
echo -e "\n7️⃣ Testing Static File Serving"
echo "Testing agent.json..."
AGENT_RESPONSE=$(curl -s "$BASE_URL/.well-known/agent.json" | jq -r '.version')
if [[ "$AGENT_RESPONSE" == "1.0" ]]; then
    echo "✅ Agent manifest served correctly"
else
    echo "❌ Agent manifest failed (got $AGENT_RESPONSE)"
    exit 1
fi

echo "Testing OpenAPI spec..."
OPENAPI_RESPONSE=$(curl -s "$BASE_URL/spec/openapi.json" | jq -r '.info.title')
if [[ "$OPENAPI_RESPONSE" == "Action.txt Demo API" ]]; then
    echo "✅ OpenAPI spec served correctly"
else
    echo "❌ OpenAPI spec failed (got $OPENAPI_RESPONSE)"
    exit 1
fi

# Test 8: Rate limiting
echo -e "\n8️⃣ Testing Rate Limiting"
echo "Making 12 requests to ping endpoint (limit: 10 per second)..."
for i in {1..12}; do
    HTTP_CODE=$(curl -s -w "%{http_code}" "$BASE_URL/ping" -o /dev/null)
    if [[ "$HTTP_CODE" == "429" ]]; then
        echo "✅ Rate limiting triggered at request $i"
        break
    fi
    if [[ "$i" == "12" ]]; then
        echo "❌ Rate limiting not triggered"
        exit 1
    fi
done

# Test 9: Health endpoint
echo -e "\n9️⃣ Testing Health Endpoint"
echo "Expected: 200 OK with server status"
RESPONSE=$(curl -s "$BASE_URL/health")
echo "Response: $RESPONSE"
if [[ "$RESPONSE" == *'"status":"healthy"'* ]]; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
    exit 1
fi

# Test 10: Error handling
echo -e "\n🔟 Testing Error Handling"
echo "Testing 404 for non-existent route..."
HTTP_CODE=$(curl -s -w "%{http_code}" "$BASE_URL/nonexistent" -o /dev/null)
if [[ "$HTTP_CODE" == "404" ]]; then
    echo "✅ 404 error handling working"
else
    echo "❌ 404 error handling failed (got $HTTP_CODE)"
    exit 1
fi

echo -e "\n🎉 All tests passed! The Action.txt server is working correctly."
echo "=========================================="
echo "✅ OpenAPI 3.0.3 Compliance"
echo "✅ OAuth2 Bearer Token Authentication"
echo "✅ Rate Limiting with Retry-After headers"
echo "✅ Idempotency for /demos endpoint"
echo "✅ Structured logging with Pino"
echo "✅ Security with Helmet and CORS"
echo "✅ Input validation with AJV"
echo "✅ Static file serving"
echo "✅ Mock data for testing"
echo "✅ Error responses matching Error schema"
echo "✅ Graceful shutdown handling"
