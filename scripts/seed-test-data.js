const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Get first user from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError || !users.length) {
      console.error('❌ No users found. Create a user via signup first.');
      return;
    }

    const testUserId = users[0].id;
    const testEmail = users[0].email;
    console.log(`📝 Using user: ${testUserId} (${testEmail})`);

    // Ensure user exists in public.users table
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: testEmail,
        net_worth: 0,
        monthly_gap: 0,
        plan: 'free'
      });

    if (userInsertError) {
      console.error('Error creating user profile:', userInsertError);
    } else {
      console.log(`✅ User profile created/updated`);
    }

    // Insert test accounts
    const accounts = [
      {
        user_id: testUserId,
        type: 'bank',
        platform: 'Chase',
        address_or_account: 'Checking',
        balance: 15000,
        currency: 'USD',
      },
      {
        user_id: testUserId,
        type: 'bank',
        platform: 'Chase',
        address_or_account: 'Savings',
        balance: 50000,
        currency: 'USD',
      },
      {
        user_id: testUserId,
        type: 'crypto',
        platform: 'Coinbase',
        address_or_account: 'BTC Wallet',
        balance: 2.5,
        currency: 'BTC',
      },
      {
        user_id: testUserId,
        type: 'trading',
        platform: 'Fidelity',
        address_or_account: 'Brokerage',
        balance: 120000,
        currency: 'USD',
      },
    ];

    const { error: accountsError } = await supabase
      .from('accounts')
      .insert(accounts);

    if (accountsError) {
      console.error('Error inserting accounts:', accountsError);
    } else {
      console.log(`✅ Inserted ${accounts.length} test accounts`);
    }

    // Insert test liabilities
    const liabilities = [
      {
        user_id: testUserId,
        type: 'credit_card',
        name: 'Amex',
        balance: 3500,
        interest_rate: 18.5,
      },
      {
        user_id: testUserId,
        type: 'mortgage',
        name: 'Home Loan',
        balance: 280000,
        interest_rate: 6.5,
      },
    ];

    const { error: liabilitiesError } = await supabase
      .from('liabilities')
      .insert(liabilities);

    if (liabilitiesError) {
      console.error('Error inserting liabilities:', liabilitiesError);
    } else {
      console.log(`✅ Inserted ${liabilities.length} test liabilities`);
    }

    // Insert test income streams
    const incomeStreams = [
      {
        user_id: testUserId,
        type: 'salary',
        name: 'Primary Job',
        amount: 8000,
        frequency: 'monthly',
      },
      {
        user_id: testUserId,
        type: 'freelance',
        name: 'Consulting',
        amount: 2000,
        frequency: 'monthly',
      },
      {
        user_id: testUserId,
        type: 'dividend',
        name: 'Investment Income',
        amount: 300,
        frequency: 'monthly',
      },
    ];

    const { error: incomeError } = await supabase
      .from('income_streams')
      .insert(incomeStreams);

    if (incomeError) {
      console.error('Error inserting income streams:', incomeError);
    } else {
      console.log(`✅ Inserted ${incomeStreams.length} test income streams`);
    }

    // Insert test transactions for last 30 days
    const categories = ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Transportation', 'Dining', 'Shopping', 'Subscriptions'];
    const transactions = [];

    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - i);

      // 2-4 transactions per day
      const txnCount = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < txnCount; j++) {
        const isExpense = Math.random() > 0.3;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = isExpense
          ? -(Math.random() * 200 + 10)
          : Math.random() * 500 + 50;

        transactions.push({
          user_id: testUserId,
          account_id: null,
          amount: Math.round(amount * 100) / 100,
          category: isExpense ? category : 'Transfer',
          description: `${category} expense`,
          transaction_date: dayDate.toISOString(),
        });
      }
    }

    const { error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactions);

    if (transactionsError) {
      console.error('Error inserting transactions:', transactionsError);
    } else {
      console.log(`✅ Inserted ${transactions.length} test transactions`);
    }

    // Insert test goals
    const goals = [
      {
        user_id: testUserId,
        name: 'Emergency Fund',
        description: '3 months of expenses',
        target_amount: 25000,
        current_amount: 15000,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'savings',
        priority: 1,
      },
      {
        user_id: testUserId,
        name: 'Vacation',
        description: 'Summer trip to Europe',
        target_amount: 5000,
        current_amount: 2100,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'travel',
        priority: 2,
      },
      {
        user_id: testUserId,
        name: 'New Laptop',
        description: 'MacBook Pro upgrade',
        target_amount: 2500,
        current_amount: 1200,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'technology',
        priority: 3,
      },
    ];

    const { error: goalsError } = await supabase
      .from('goals')
      .insert(goals);

    if (goalsError) {
      console.error('Error inserting goals:', goalsError);
    } else {
      console.log(`✅ Inserted ${goals.length} test goals`);
    }

    console.log('\n🎉 Test data seeded successfully!');
    console.log(`\n✨ Dashboard should now show:`);
    console.log(`   Net Worth: ~-$96,000`);
    console.log(`   Monthly Gap: ~$6,000`);
    console.log(`   Runway: ~45 days\n`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();
