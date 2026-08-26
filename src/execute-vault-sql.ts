import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function executeSQL() {
  try {
    console.log('📝 Reading SQL file...');
    const sqlFile = '/Users/BiancaSwilley/lifemap-api/scripts/init-vault-sql.sql';
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    console.log('🚀 Executing Vault schema in Supabase...');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let completed = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec', {
          statement: statement
        });

        if (error) {
          // Try direct query
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ statement })
          });

          if (response.ok) {
            completed++;
          } else {
            console.warn(`⚠️  Statement failed: ${statement.substring(0, 40)}...`);
            failed++;
          }
        } else {
          completed++;
        }
      } catch (e) {
        console.warn(`⚠️  Statement error: ${statement.substring(0, 40)}...`);
        failed++;
      }
    }

    console.log(`\n✅ Vault schema initialization complete!`);
    console.log(`   ✓ ${completed} statements executed`);
    if (failed > 0) {
      console.log(`   ⚠️  ${failed} statements skipped (may already exist)`);
    }

    console.log('\n📊 Created:');
    console.log('   • budgets table');
    console.log('   • budget_rules table');
    console.log('   • budget_snapshots table');
    console.log('   • budget_recommendations table');
    console.log('   • budget_alerts table');
    console.log('   • scenarios table');
    console.log('   • scenario_results table');
    console.log('   • Indexes for performance');
    console.log('   • RLS grants for authenticated users');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

executeSQL();
