import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking Vault schema...\n');

    const tables = ['budgets', 'budget_rules', 'budget_snapshots', 'budget_recommendations', 'budget_alerts', 'scenarios', 'scenario_results'];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: NOT FOUND (needs creation)`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
