-- Historical financial snapshots view
CREATE OR REPLACE VIEW user_financial_trends AS
SELECT
  user_id,
  DATE_TRUNC('day', transaction_date)::DATE as day,
  (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE accounts.user_id = transactions.user_id AND accounts.created_at <= DATE_TRUNC('day', transaction_date)) as assets_eod,
  (SELECT COALESCE(SUM(balance), 0) FROM liabilities WHERE liabilities.user_id = transactions.user_id AND liabilities.created_at <= DATE_TRUNC('day', transaction_date)) as liabilities_eod,
  COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as daily_income,
  COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as daily_expenses
FROM transactions
GROUP BY user_id, DATE_TRUNC('day', transaction_date);

-- Monthly aggregate trends
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', transaction_date)::DATE as month,
  (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE accounts.user_id = transactions.user_id) as total_assets,
  (SELECT COALESCE(SUM(balance), 0) FROM liabilities WHERE liabilities.user_id = transactions.user_id) as total_liabilities,
  COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as month_income,
  COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as month_expenses,
  COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date);

-- Category spending trends
CREATE OR REPLACE VIEW category_trends AS
SELECT
  user_id,
  category,
  DATE_TRUNC('month', transaction_date)::DATE as month,
  COUNT(*) as transaction_count,
  COALESCE(SUM(ABS(amount)), 0) as total_spent,
  AVG(ABS(amount)) as avg_transaction
FROM transactions
WHERE amount < 0
GROUP BY user_id, category, DATE_TRUNC('month', transaction_date);

-- Goal progress tracking
CREATE OR REPLACE VIEW goal_progress_view AS
SELECT
  g.id,
  g.user_id,
  g.name,
  g.target_amount,
  g.current_amount,
  g.deadline,
  ROUND(((g.current_amount / g.target_amount) * 100)::NUMERIC, 2) as progress_percent,
  (g.target_amount - g.current_amount) as remaining_amount,
  EXTRACT(DAY FROM g.deadline - NOW()) as days_until_deadline,
  ROUND(((g.target_amount - g.current_amount) / NULLIF(EXTRACT(DAY FROM g.deadline - NOW()), 0))::NUMERIC, 2) as daily_required
FROM goals g;
