#!/bin/bash

# Insert budgets directly
curl -s "https://zctunbobkokehcirkjuz.supabase.co/rest/v1/budgets" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "user_id": "d31f2432-b3e7-449c-bbe5-ef86f681d094",
      "category": "Utilities",
      "monthly_amount": 200
    },
    {
      "user_id": "d31f2432-b3e7-449c-bbe5-ef86f681d094",
      "category": "Groceries",
      "monthly_amount": 400
    },
    {
      "user_id": "d31f2432-b3e7-449c-bbe5-ef86f681d094",
      "category": "Entertainment",
      "monthly_amount": 300
    }
  ]'
