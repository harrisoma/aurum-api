-- Complete RLS Setup for Vault Tables
-- This script enables RLS and creates all necessary policies for data isolation

-- ========================================
-- 1. ENABLE RLS ON ALL VAULT TABLES
-- ========================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. BUDGETS - All CRUD operations for user's own records
-- ========================================
CREATE POLICY budgets_select ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budgets_insert ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_update ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_delete ON budgets FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. BUDGET_RULES - All CRUD for user's budget rules
-- ========================================
CREATE POLICY budget_rules_select ON budget_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_rules_insert ON budget_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_rules_update ON budget_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_rules_delete ON budget_rules FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 4. BUDGET_SNAPSHOTS - All CRUD for user's snapshots
-- ========================================
CREATE POLICY budget_snapshots_select ON budget_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_snapshots_insert ON budget_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_snapshots_update ON budget_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_snapshots_delete ON budget_snapshots FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. BUDGET_RECOMMENDATIONS - All CRUD for user's recommendations
-- ========================================
CREATE POLICY budget_recommendations_select ON budget_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_recommendations_insert ON budget_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_recommendations_update ON budget_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_recommendations_delete ON budget_recommendations FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 6. BUDGET_ALERTS - All CRUD for user's alerts
-- ========================================
CREATE POLICY budget_alerts_select ON budget_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_alerts_insert ON budget_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_alerts_update ON budget_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_alerts_delete ON budget_alerts FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 7. SCENARIOS - All CRUD for user's scenarios
-- ========================================
CREATE POLICY scenarios_select ON scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scenarios_insert ON scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenarios_update ON scenarios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenarios_delete ON scenarios FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 8. SCENARIO_RESULTS - All CRUD for user's results
-- ========================================
CREATE POLICY scenario_results_select ON scenario_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scenario_results_insert ON scenario_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenario_results_update ON scenario_results FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenario_results_delete ON scenario_results FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- DONE: All RLS policies are now in place
-- ========================================
