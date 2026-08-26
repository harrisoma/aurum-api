-- VAULT: Budget Intelligence Tables

-- Main budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  monthly_amount DECIMAL(10, 2) NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly',
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
  rule_type VARCHAR(50),
  threshold_percent DECIMAL(5, 2),
  action VARCHAR(255),
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
  confidence_score DECIMAL(3, 2),
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
  alert_type VARCHAR(50),
  message TEXT,
  severity VARCHAR(20),
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scenario analysis tables
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255) NOT NULL,
  scenario_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scenario_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  net_worth_impact DECIMAL(12, 2),
  runway_impact DECIMAL(10, 2),
  velocity_impact DECIMAL(5, 2),
  budget_impact DECIMAL(10, 2),
  goal_progress_impact DECIMAL(5, 2),
  recommendation VARCHAR(50),
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budget_rules_budget_id ON budget_rules(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);

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

-- Grant permissions
GRANT ALL ON budgets TO authenticated;
GRANT ALL ON budget_rules TO authenticated;
GRANT ALL ON budget_snapshots TO authenticated;
GRANT ALL ON budget_recommendations TO authenticated;
GRANT ALL ON budget_alerts TO authenticated;
GRANT ALL ON scenarios TO authenticated;
GRANT ALL ON scenario_results TO authenticated;
GRANT SELECT ON budget_status_view TO authenticated;
