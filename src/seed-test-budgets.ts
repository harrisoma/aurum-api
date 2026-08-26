import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function seedBudgets() {
  try {
    const userId = 'd31f2432-b3e7-449c-bbe5-ef86f681d094'; // harrisoma@yahoo.com

    console.log('📊 Creating test budgets for user...\n');

    const budgets = [
      { category: 'Utilities', monthlyAmount: 200 },
      { category: 'Groceries', monthlyAmount: 400 },
      { category: 'Entertainment', monthlyAmount: 300 },
      { category: 'Transportation', monthlyAmount: 250 },
    ];

    for (const budget of budgets) {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category: budget.category,
          monthly_amount: budget.monthlyAmount,
          is_active: true,
        });

      if (error) {
        console.log(`❌ ${budget.category}: ${error.message}`);
      } else {
        console.log(`✅ ${budget.category}: $${budget.monthlyAmount}/month`);
      }
    }

    console.log('\n✅ Budgets created!');
    console.log('\nNow test the endpoints with:');
    console.log('curl http://localhost:4000/api/vault/status \\');
    console.log('  -H "Authorization: Bearer <token>"');

  } catch (error) {
    console.error('Error:', error);
  }
}

seedBudgets();
