import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function debugUsers() {
  try {
    console.log('🔍 Checking users and financial data...\n');

    // Get users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users?.users.length} users:\n`);

    for (const user of users?.users || []) {
      console.log(`User: ${user.email} (${user.id})`);

      // Check if user has accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .limit(3);

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      console.log(`  • Accounts: ${accounts?.length || 0}`);
      console.log(`  • Transactions: ${transactions?.length || 0}`);
      console.log(`  • Budgets: ${budgets?.length || 0}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugUsers();
