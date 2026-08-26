import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const setupVaultTables = async () => {
  console.log('Setting up Vault tables...\n');

  const statements = [
    // Budgets table
    `CREATE TABLE IF NOT EXISTS budgets (
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
    )`,

    // Budget rules
    `CREATE TABLE IF NOT EXISTS budget_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      rule_type VARCHAR(50),
      threshold_percent DECIMAL(5, 2),
      action VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Budget snapshots
    `CREATE TABLE IF NOT EXISTS budget_snapshots (
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
    )`,

    // Budget recommendations
    `CREATE TABLE IF NOT EXISTS budget_recommendations (
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
    )`,

    // Budget alerts
    `CREATE TABLE IF NOT EXISTS budget_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      alert_type VARCHAR(50),
      message TEXT,
      severity VARCHAR(20),
      is_acknowledged BOOLEAN DEFAULT false,
      acknowledged_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Scenarios
    `CREATE TABLE IF NOT EXISTS scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      scenario_name VARCHAR(255) NOT NULL,
      scenario_type VARCHAR(50),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Scenario results
    `CREATE TABLE IF NOT EXISTS scenario_results (
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
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category)`,
    `CREATE INDEX IF NOT EXISTS idx_budget_rules_budget_id ON budget_rules(budget_id)`,
    `CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date)`,
    `CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id)`,

    // Enable RLS
    `ALTER TABLE budgets ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY`,

    // Create RLS policies for budgets
    `CREATE POLICY budgets_select ON budgets FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY budgets_insert ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budgets_update ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budgets_delete ON budgets FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for budget_rules
    `CREATE POLICY budget_rules_select ON budget_rules FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY budget_rules_insert ON budget_rules FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_rules_update ON budget_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_rules_delete ON budget_rules FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for budget_snapshots
    `CREATE POLICY budget_snapshots_select ON budget_snapshots FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY budget_snapshots_insert ON budget_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_snapshots_update ON budget_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_snapshots_delete ON budget_snapshots FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for budget_recommendations
    `CREATE POLICY budget_recommendations_select ON budget_recommendations FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY budget_recommendations_insert ON budget_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_recommendations_update ON budget_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_recommendations_delete ON budget_recommendations FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for budget_alerts
    `CREATE POLICY budget_alerts_select ON budget_alerts FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY budget_alerts_insert ON budget_alerts FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_alerts_update ON budget_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY budget_alerts_delete ON budget_alerts FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for scenarios
    `CREATE POLICY scenarios_select ON scenarios FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY scenarios_insert ON scenarios FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY scenarios_update ON scenarios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY scenarios_delete ON scenarios FOR DELETE USING (auth.uid() = user_id)`,

    // Create RLS policies for scenario_results
    `CREATE POLICY scenario_results_select ON scenario_results FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY scenario_results_insert ON scenario_results FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY scenario_results_update ON scenario_results FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY scenario_results_delete ON scenario_results FOR DELETE USING (auth.uid() = user_id)`,
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: statement });
      if (error) throw error;
      successCount++;
      console.log(`✓ [${i + 1}/${statements.length}] ${statement.split('\n')[0].substring(0, 60)}...`);
    } catch (err: any) {
      errorCount++;
      console.error(`✗ [${i + 1}/${statements.length}] Error: ${err.message}`);
    }
  }

  console.log(`\n✓ Successfully executed: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} statements`);
  }
};

setupVaultTables().catch(console.error);
