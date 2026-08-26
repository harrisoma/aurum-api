-- VAULT: Budget Intelligence Tables

-- Main budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  monthly_amount DECIMAL(10, 2) NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annual
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category, start_date)
);

-- Budget rules (hard caps, soft alerts, escalations)
CREATE TABLE IF NOT EXISTS budget_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  rule_type VARCHAR(50), -- hard_cap, soft_alert, escalation
  threshold_percent DECIMAL(5, 2), -- 80%, 100%, 120%
  action VARCHAR(255), -- email, notification, disable_spending
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily budget snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  budgeted_amount DECIMAL(10, 2),
  spent_to_date DECIMAL(10, 2),
  remaining_amount DECIMAL(10, 2),
  variance_percent DECIMAL(5, 2),
  projected_month_end DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, budget_id, snapshot_date)
);

-- Smart budget recommendations
CREATE TABLE IF NOT EXISTS budget_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  recommended_amount DECIMAL(10, 2) NOT NULL,
  reasoning TEXT,
  confidence_score DECIMAL(3, 2), -- 0.5 - 1.0
  historical_avg DECIMAL(10, 2),
  historical_std_dev DECIMAL(10, 2),
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, category, DATE(generated_at))
);

-- Budget alerts log
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- warning, critical, forecast
  message TEXT,
  severity VARCHAR(20), -- low, medium, high, critical
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budget_rules_budget_id ON budget_rules(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);

-- View: Current budget status
CREATE OR REPLACE VIEW budget_status_view AS
SELECT
  b.id,
  b.user_id,
  b.category,
  b.monthly_amount as budgeted,
  COALESCE(SUM(CASE WHEN t.amount < 0 AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', NOW()) THEN ABS(t.amount) ELSE 0 END), 0) as spent_this_month,
  b.monthly_amount - COALESCE(SUM(CASE WHEN t.amount < 0 AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', NOW()) THEN ABS(t.amount) ELSE 0 END), 0) as remaining,
  ROUND(100.0 * COALESCE(SUM(CASE WHEN t.amount < 0 AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', NOW()) THEN ABS(t.amount) ELSE 0 END), 0) / NULLIF(b.monthly_amount, 0), 2) as percent_used,
  b.is_active,
  b.created_at
FROM budgets b
LEFT JOIN transactions t ON b.user_id = t.user_id AND t.category = b.category
WHERE b.is_active = true
GROUP BY b.id, b.user_id, b.category, b.monthly_amount;

-- View: Budget variance (actual vs. recommended)
CREATE OR REPLACE VIEW budget_variance_view AS
SELECT
  b.id,
  b.user_id,
  b.category,
  b.monthly_amount as actual_budget,
  br.recommended_amount,
  (b.monthly_amount - br.recommended_amount) as variance_amount,
  ROUND(100.0 * (b.monthly_amount - br.recommended_amount) / NULLIF(br.recommended_amount, 0), 2) as variance_percent,
  br.confidence_score
FROM budgets b
LEFT JOIN budget_recommendations br ON b.user_id = br.user_id AND b.category = br.category
WHERE DATE(br.generated_at) = CURRENT_DATE;
