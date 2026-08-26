import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function debugSchema() {
  try {
    console.log('🔍 Transaction table structure:\n');

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);

    if (transactions && transactions.length > 0) {
      console.log('Columns:', Object.keys(transactions[0]));
      console.log('Sample row:', transactions[0]);
    } else {
      console.log('No transactions found');
    }

    console.log('\n\n🔍 Budgets table structure:\n');
    
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .limit(1);

    if (budgets && budgets.length > 0) {
      console.log('Columns:', Object.keys(budgets[0]));
      console.log('Sample row:', budgets[0]);
    } else {
      console.log('No budgets found - table is empty');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugSchema();
