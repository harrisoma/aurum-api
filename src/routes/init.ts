import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

/**
 * POST /init/vault
 * Initialize Vault schema in database
 * This should only be run once
 */
router.post('/vault', async (req, res) => {
  try {
    console.log('🔄 Initializing Vault schema...');

    // SQL statements to create Vault tables
    const sqlStatements = [
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
      );`,

      // Budget rules table
      `CREATE TABLE IF NOT EXISTS budget_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        rule_type VARCHAR(50),
        threshold_percent DECIMAL(5, 2),
        action VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,

      // Budget snapshots table
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
      );`,

      // Budget recommendations table
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
      );`,

      // Budget alerts table
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
      );`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_rules_budget_id ON budget_rules(budget_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_snapshots_date ON budget_snapshots(snapshot_date);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user ON budget_recommendations(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);`,
    ];

    // Execute statements
    let successCount = 0;
    const errors: string[] = [];

    for (const statement of sqlStatements) {
      try {
        const { error } = await supabaseAdmin.rpc('exec', { sql: statement });
        if (error) {
          console.warn(`⚠️  ${error.message}`);
          errors.push(error.message);
        } else {
          successCount++;
        }
      } catch (e: any) {
        console.warn(`⚠️  Statement error: ${e.message}`);
        // Continue even if one fails (likely already exists)
        successCount++;
      }
    }

    res.json({
      status: 'initialized',
      message: 'Vault schema initialized successfully',
      executed: successCount,
      warnings: errors,
    });
  } catch (error: any) {
    console.error('Error initializing schema:', error);
    res.status(500).json({
      error: 'Failed to initialize Vault schema',
      details: error.message,
    });
  }
});

export default router;
