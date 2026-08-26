import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function checkBudgetsSchema() {
  try {
    console.log('🔍 Checking if budgets table exists in info_schema...\n');

    // Try querying the budgets table metadata
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'budgets')
      .eq('table_schema', 'public');

    if (columns && columns.length > 0) {
      console.log('Budgets table columns:');
      columns.forEach((col: any) => {
        console.log(`  • ${col.column_name} (${col.data_type})`);
      });
    } else {
      // Try another approach - query the table directly
      console.log('Checking via direct query...');
      const { data: sampleData, error } = await supabase
        .from('budgets')
        .select('*')
        .limit(1);

      if (error) {
        console.log('Table exists but query failed:', error.message);
      } else if (!sampleData || sampleData.length === 0) {
        console.log('Table appears to exist but is empty');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBudgetsSchema();
