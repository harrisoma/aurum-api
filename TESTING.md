# Life Map API Testing Guide

## Setup

1. **Start the API server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`

2. **Seed test data**
   ```bash
   npm run seed
   ```
   This inserts realistic test data for the first user in your Supabase auth system.

3. **Get authentication token**
   - Sign up via the Next.js app at `localhost:3000`
   - Copy the JWT from browser localStorage: `supabase.auth.getSession()`
   - Or get token from Supabase dashboard: Project Settings → API

## API Endpoints

### Core Financial Metrics

#### GET `/api/financial/snapshot`
**Complete financial overview**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/financial/snapshot
```

Response includes:
- `netWorth` - Total assets minus liabilities
- `monthlyGap` - Income minus expenses
- `dailyBurnRate` - Average daily spending
- `runway` - Days of expenses you can cover
- `velocity` - Spending as % of income (100% = breakeven)
- `accountsCount` - Number of connected accounts
- `goalsCount` - Number of financial goals

#### GET `/api/financial/net-worth`
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/financial/net-worth
```

#### GET `/api/financial/gap`
Monthly income minus expenses.

#### GET `/api/financial/burn-rate`
Average daily spending. Optional query: `?days=60` (default: 30)

### Advanced Analytics

#### GET `/api/financial/trends`
**12-month financial history**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/financial/trends
```

Returns monthly summaries with assets, liabilities, income, expenses.

#### GET `/api/financial/category-breakdown`
**Spending by category**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/financial/category-breakdown
```

Returns spending totals grouped by category (Groceries, Dining, etc.)

#### GET `/api/financial/runway-forecast`
**Sustainability analysis**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/financial/runway-forecast
```

Response:
- `runway` - Days until funds deplete (if expenses > income)
- `runwayMonths` - Runway in months
- `velocity` - Spending rate
- `status` - "sustainable", "healthy", or "critical"
- `alert` - Boolean if runway < 30 days

### Account & Transaction Data

#### GET `/api/financial/accounts`
All connected accounts

#### GET `/api/financial/transactions`
Recent transactions. Optional: `?limit=100` (default: 50)

#### GET `/api/financial/goals`
Goals with progress tracking
- `daysLeft` - Days until deadline
- `progress` - % toward target
- `monthsLeft` - Months to deadline
- `monthlyRequired` - Amount needed per month

## Test Data Generated

### Accounts
- Chase Checking: $15,000
- Chase Savings: $50,000
- Coinbase BTC: 2.5 BTC
- Fidelity Brokerage: $120,000

**Total Assets: ~$187,500**

### Liabilities
- Amex Credit Card: $3,500
- Mortgage: $280,000

**Total Liabilities: $283,500**
**Net Worth: -$96,000** (typical real estate scenario)

### Monthly Income
- Primary Job: $8,000
- Consulting: $2,000
- Dividends: $300
**Total: $10,300/month**

### Transactions
- 30 days of realistic spending (~60-120 transactions)
- 8 categories: Groceries, Rent, Utilities, Entertainment, Transportation, Dining, Shopping, Subscriptions
- Range: $10-$210 per transaction

### Goals
- Emergency Fund: $15,000/$25,000 (6 months)
- Vacation: $2,100/$5,000 (4 months)
- Laptop: $1,200/$2,500 (3 months)

## Key Metrics Explained

### Runway
**Days of liquid assets before cash depletion**
- Formula: Assets ÷ Daily Burn Rate
- Value < 0 = Positive cash flow (sustainable)
- 30-90 days = Healthy
- < 30 days = Critical (alert triggered)

### Velocity
**Spending efficiency ratio**
- Formula: (Monthly Expenses ÷ Monthly Income) × 100
- < 100% = Surplus (saving money)
- = 100% = Breakeven
- > 100% = Deficit (spending more than earning)

### Monthly Gap
**Net monthly cash flow**
- Positive = Accumulating wealth
- Negative = Depleting savings

## Testing Workflow

1. **Check your snapshot**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:4000/api/financial/snapshot
   ```

2. **Analyze spending trends**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:4000/api/financial/trends
   ```

3. **Get runway forecast**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:4000/api/financial/runway-forecast
   ```

4. **Review goal progress**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:4000/api/financial/goals
   ```

## Database Views

The following materialized views power the analytics:

- `user_financial_trends` - Daily aggregated metrics
- `monthly_financial_summary` - Monthly rollups
- `category_trends` - Spending by category over time
- `goal_progress_view` - Goal tracking with velocity

These can be queried directly if you need raw data:
```sql
SELECT * FROM monthly_financial_summary WHERE user_id = 'YOUR_USER_ID';
```

## Troubleshooting

### "Unauthorized" Error
- Verify token is valid and not expired
- Token should be in `Authorization: Bearer TOKEN` header

### "Failed to fetch accounts"
- Ensure test data was seeded (`npm run seed`)
- Check database tables exist in Supabase

### Runway shows -1
- This means positive cash flow (income > expenses)
- You're not depleting assets

### No transactions
- Need to run `npm run seed` to populate test data
- Or insert transactions manually via Supabase dashboard

## Performance Notes

- Snapshot queries use indexed user_id lookups (~50ms)
- Trends query 12 months of data (~100ms)
- Category breakdown aggregates all transactions (~200ms)
- Runway forecast chains multiple queries (~300ms)

All endpoints cache calculation results client-side when called multiple times in quick succession.
