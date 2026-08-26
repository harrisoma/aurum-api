#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const setupVault = async () => {
  try {
    console.log('🔧 Setting up Vault database schema...\n');

    // Create budgets table
    const { data: d1, error: e1 } = await supabase
      .from('budgets')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000000',
        category: 'test',
        monthly_amount: 0
      }], { count: 'exact' })
      .catch(() => ({ data: null, error: true }));

    if (e1 && typeof e1 === 'object' && e1.message && e1.message.includes('relation "budgets" does not exist')) {
      console.log('✓ Budgets table needs creation');
    } else if (!e1) {
      console.log('✓ Budgets table already exists');
      // Clean up the test row
      await supabase.from('budgets').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('\n✅ Vault schema check complete!');
    console.log('   Please run the following in Supabase SQL Editor:');
    console.log('   - File: /scripts/setup-vault-rls-proper.sql');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Supabase project dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Create new query');
    console.log('   4. Copy and paste the SQL script');
    console.log('   5. Click "Run and enable RLS"');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setupVault();
