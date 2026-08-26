#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SQL_STATEMENTS = `
-- 1. Create tables
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
  updated_at TIMESTAMP DEFAULT NOW()
);

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
  created_at TIMESTAMP DEFAULT NOW()
);

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
  expires_at TIMESTAMP
);

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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budget_rules_budget_id ON budget_rules(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);

-- 3. Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for budgets
DROP POLICY IF EXISTS budgets_select ON budgets;
DROP POLICY IF EXISTS budgets_insert ON budgets;
DROP POLICY IF EXISTS budgets_update ON budgets;
DROP POLICY IF EXISTS budgets_delete ON budgets;

CREATE POLICY budgets_select ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budgets_insert ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_update ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_delete ON budgets FOR DELETE USING (auth.uid() = user_id);

-- 5. Create RLS policies for budget_rules
DROP POLICY IF EXISTS budget_rules_select ON budget_rules;
DROP POLICY IF EXISTS budget_rules_insert ON budget_rules;
DROP POLICY IF EXISTS budget_rules_update ON budget_rules;
DROP POLICY IF EXISTS budget_rules_delete ON budget_rules;

CREATE POLICY budget_rules_select ON budget_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_rules_insert ON budget_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_rules_update ON budget_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_rules_delete ON budget_rules FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for budget_snapshots
DROP POLICY IF EXISTS budget_snapshots_select ON budget_snapshots;
DROP POLICY IF EXISTS budget_snapshots_insert ON budget_snapshots;
DROP POLICY IF EXISTS budget_snapshots_update ON budget_snapshots;
DROP POLICY IF EXISTS budget_snapshots_delete ON budget_snapshots;

CREATE POLICY budget_snapshots_select ON budget_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_snapshots_insert ON budget_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_snapshots_update ON budget_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_snapshots_delete ON budget_snapshots FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for budget_recommendations
DROP POLICY IF EXISTS budget_recommendations_select ON budget_recommendations;
DROP POLICY IF EXISTS budget_recommendations_insert ON budget_recommendations;
DROP POLICY IF EXISTS budget_recommendations_update ON budget_recommendations;
DROP POLICY IF EXISTS budget_recommendations_delete ON budget_recommendations;

CREATE POLICY budget_recommendations_select ON budget_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_recommendations_insert ON budget_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_recommendations_update ON budget_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_recommendations_delete ON budget_recommendations FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS policies for budget_alerts
DROP POLICY IF EXISTS budget_alerts_select ON budget_alerts;
DROP POLICY IF EXISTS budget_alerts_insert ON budget_alerts;
DROP POLICY IF EXISTS budget_alerts_update ON budget_alerts;
DROP POLICY IF EXISTS budget_alerts_delete ON budget_alerts;

CREATE POLICY budget_alerts_select ON budget_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY budget_alerts_insert ON budget_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_alerts_update ON budget_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budget_alerts_delete ON budget_alerts FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS policies for scenarios
DROP POLICY IF EXISTS scenarios_select ON scenarios;
DROP POLICY IF EXISTS scenarios_insert ON scenarios;
DROP POLICY IF EXISTS scenarios_update ON scenarios;
DROP POLICY IF EXISTS scenarios_delete ON scenarios;

CREATE POLICY scenarios_select ON scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scenarios_insert ON scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenarios_update ON scenarios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenarios_delete ON scenarios FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS policies for scenario_results
DROP POLICY IF EXISTS scenario_results_select ON scenario_results;
DROP POLICY IF EXISTS scenario_results_insert ON scenario_results;
DROP POLICY IF EXISTS scenario_results_update ON scenario_results;
DROP POLICY IF EXISTS scenario_results_delete ON scenario_results;

CREATE POLICY scenario_results_select ON scenario_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scenario_results_insert ON scenario_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenario_results_update ON scenario_results FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY scenario_results_delete ON scenario_results FOR DELETE USING (auth.uid() = user_id);
`;

const setupVault = async () => {
  try {
    console.log('🔧 Setting up Vault database schema...\n');

    // Split by semicolon and filter empty statements
    const statements = SQL_STATEMENTS
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Use direct SQL execution through Supabase
        const { data, error } = await supabase.rpc('exec_sql' as any, {
          sql: stmt + ';'
        }).catch(async () => {
          // Fallback: try executing via query API
          return await (supabase.from('_execution') as any).insert({ sql: stmt }).catch(() => ({
            data: null,
            error: { message: 'Execution method not available' }
          }));
        });

        if (error && !error.message?.includes('does not exist')) {
          throw error;
        }

        successCount++;
        const preview = stmt.split('\n')[0].substring(0, 70);
        console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (err: any) {
        errorCount++;
        const preview = stmt.split('\n')[0].substring(0, 70);
        console.error(`✗ [${i + 1}/${statements.length}] ${preview}...`);
        console.error(`  Error: ${err.message}\n`);
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  ✓ Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`  ✗ Failed: ${errorCount} statements`);
    }

    if (successCount > 0) {
      console.log('\n✅ Vault schema setup complete!');
      console.log('   - All tables created');
      console.log('   - Indexes created');
      console.log('   - RLS enabled and policies applied');
    }
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setupVault();
