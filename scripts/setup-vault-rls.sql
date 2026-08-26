-- Enable RLS on Vault tables
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;

-- Budgets: Users can see and modify their own budgets
CREATE POLICY "budgets_select" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budgets_delete" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Budget Rules: Users can see and modify rules for their budgets
CREATE POLICY "budget_rules_select" ON budget_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budget_rules_insert" ON budget_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budget_rules_update" ON budget_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budget_rules_delete" ON budget_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Budget Snapshots: Users can see and create snapshots of their budgets
CREATE POLICY "budget_snapshots_select" ON budget_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budget_snapshots_insert" ON budget_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Budget Recommendations: Users can see their recommendations
CREATE POLICY "budget_recommendations_select" ON budget_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budget_recommendations_insert" ON budget_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Budget Alerts: Users can see and acknowledge their alerts
CREATE POLICY "budget_alerts_select" ON budget_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budget_alerts_insert" ON budget_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budget_alerts_update" ON budget_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Scenarios: Users can see and modify their scenarios
CREATE POLICY "scenarios_select" ON scenarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scenarios_insert" ON scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scenarios_update" ON scenarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "scenarios_delete" ON scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Scenario Results: Users can see results for their scenarios
CREATE POLICY "scenario_results_select" ON scenario_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scenario_results_insert" ON scenario_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to bypass RLS for admin operations
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE scenarios FORCE ROW LEVEL SECURITY;
ALTER TABLE scenario_results FORCE ROW LEVEL SECURITY;
