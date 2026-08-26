#!/bin/bash

echo "🧪 Testing Vault Endpoints"
echo ""

# Get a JWT token from the seed data user
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdHVuYm9ia29rZWhjaXJranV6Iiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3MjMwMDcwMDAsImV4cCI6MTk0MTQyNDAwMCwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXV0aF90aW1lIjoxNzIzMDA3MDAwLCJzdWIiOiI0OTBhYzhkYi05YzIwLTRmYTAtYTg0Yy1lYzcxNzAzYWJkZTgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiY29uZmlybWVkX2F0IjoxNzIzMDA3MDAwLCJkaXNwbmF5X25hbWUiOiIiLCJ1c2VyX25hbWUiOiIiLCJwaG9uZSI6IiIsInNlc3Npb25faWQiOiI1YWQ5MjUyZS1lNzJlLTQzMWQtYTZmMC1lMGYzN2YxZTcwMjUiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.FG0-iL3CtNWDiSFOCsXvMqSp6cZNPLBZ5ThjwEjx8Yo"

BASE_URL="http://localhost:4000/api/vault"

echo "1️⃣  Testing GET /vault/status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""
echo ""

echo "2️⃣  Testing POST /vault/recommendations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "$BASE_URL/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""
echo ""

echo "3️⃣  Testing GET /vault/forecast"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/forecast" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""
echo ""

echo "4️⃣  Testing GET /vault/insights (AI with DeepSeek)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/insights" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""
echo ""

echo "5️⃣  Testing GET /vault/recommendations-monthly (AI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/recommendations-monthly" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""
echo ""

echo "6️⃣  Testing GET /vault/dashboard (Complete Snapshot)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Request failed"
echo ""

echo "✅ Tests complete!"
