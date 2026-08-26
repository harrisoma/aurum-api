import { supabaseAdmin } from './supabase';

export interface UserFinancialSnapshot {
  netWorth: number;
  monthlyGap: number;
  dailyBurnRate: number;
  accountsCount: number;
  goalsCount: number;
  runway: number;
  velocity: number;
}

export interface Account {
  id: string;
  type: 'crypto' | 'bank' | 'payment_app' | 'trading';
  platform: string;
  balance: number;
  currency: string;
  lastSync: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface FinancialMetrics {
  assets: number;
  liabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyGap: number;
  burnRate: number;
  runway: number;
  velocity: number;
}

export async function getAdvancedMetrics(userId: string): Promise<FinancialMetrics> {
  const sql = `
    WITH user_assets AS (
      SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = $1
    ),
    user_liabilities AS (
      SELECT COALESCE(SUM(balance), 0) as total FROM liabilities WHERE user_id = $1
    ),
    monthly_income AS (
      SELECT COALESCE(SUM(amount), 0) as total FROM income_streams WHERE user_id = $1
    ),
    month_expenses AS (
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE user_id = $1 AND transaction_date >= DATE_TRUNC('month', NOW())
    ),
    burn_rate_calc AS (
      SELECT COALESCE(AVG(daily_spend), 0) as daily_burn FROM (
        SELECT COALESCE(SUM(ABS(amount)), 0) / EXTRACT(DAY FROM DATE_TRUNC('day', NOW()) - DATE_TRUNC('month', NOW()) + INTERVAL '1 day') as daily_spend
        FROM transactions
        WHERE user_id = $1 AND transaction_date >= NOW() - INTERVAL '30 days'
      ) sub
    )
    SELECT
      (SELECT total FROM user_assets) as assets,
      (SELECT total FROM user_liabilities) as liabilities,
      (SELECT total FROM user_assets) - (SELECT total FROM user_liabilities) as net_worth,
      (SELECT total FROM monthly_income) as monthly_income,
      (SELECT total FROM month_expenses) as monthly_expenses,
      (SELECT total FROM monthly_income) - (SELECT total FROM month_expenses) as monthly_gap,
      (SELECT daily_burn FROM burn_rate_calc) as burn_rate,
      CASE
        WHEN (SELECT daily_burn FROM burn_rate_calc) <= 0 THEN -1
        ELSE ((SELECT total FROM user_assets) / NULLIF((SELECT daily_burn FROM burn_rate_calc), 0))
      END as runway,
      CASE
        WHEN (SELECT total FROM monthly_income) = 0 THEN 0
        ELSE ((SELECT total FROM month_expenses) / NULLIF((SELECT total FROM monthly_income), 0)) * 100
      END as velocity;
  `;

  const { data, error } = await supabaseAdmin.rpc('execute_sql', {
    sql,
    params: [userId],
  }).select() as any;

  if (error || !data?.length) {
    const fallback = await calculateMetricsFallback(userId);
    return fallback;
  }

  return data[0] || (await calculateMetricsFallback(userId));
}

async function calculateMetricsFallback(userId: string): Promise<FinancialMetrics> {
  const { data: accounts } = await supabaseAdmin
    .from('accounts')
    .select('balance')
    .eq('user_id', userId);

  const { data: liabilities } = await supabaseAdmin
    .from('liabilities')
    .select('balance')
    .eq('user_id', userId);

  const { data: incomeStreams } = await supabaseAdmin
    .from('income_streams')
    .select('amount')
    .eq('user_id', userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: expenses } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('transaction_date', startOfMonth.toISOString());

  const assets = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;
  const liabs = liabilities?.reduce((sum, l) => sum + (l.balance || 0), 0) || 0;
  const income = incomeStreams?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const expenseTotal = expenses?.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0) || 0;

  const gap = income - expenseTotal;
  const burnRate = expenseTotal / 30;
  const runway = burnRate <= 0 ? -1 : assets / burnRate;
  const velocity = income === 0 ? 0 : (expenseTotal / income) * 100;

  return {
    assets,
    liabilities: liabs,
    netWorth: assets - liabs,
    monthlyIncome: income,
    monthlyExpenses: expenseTotal,
    monthlyGap: gap,
    burnRate,
    runway,
    velocity,
  };
}

export async function calculateNetWorth(userId: string): Promise<number> {
  const metrics = await calculateMetricsFallback(userId);
  return metrics.netWorth;
}

export async function calculateMonthlyGap(userId: string): Promise<number> {
  const metrics = await calculateMetricsFallback(userId);
  return metrics.monthlyGap;
}

export async function calculateDailyBurnRate(userId: string, days: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('transaction_date', cutoffDate.toISOString());

  const totalSpent = transactions?.reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0) || 0;
  return totalSpent / days;
}

export async function getUserFinancialSnapshot(userId: string): Promise<UserFinancialSnapshot> {
  const [metrics, { data: accounts }, { data: goals }] = await Promise.all([
    calculateMetricsFallback(userId),
    supabaseAdmin.from('accounts').select('id').eq('user_id', userId),
    supabaseAdmin.from('goals').select('id').eq('user_id', userId),
  ]);

  return {
    netWorth: metrics.netWorth,
    monthlyGap: metrics.monthlyGap,
    dailyBurnRate: metrics.burnRate,
    accountsCount: accounts?.length || 0,
    goalsCount: goals?.length || 0,
    runway: Math.round(metrics.runway * 10) / 10,
    velocity: Math.round(metrics.velocity * 100) / 100,
  };
}

export async function getUserAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }

  return data || [];
}

export async function getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export async function getUserGoals(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return (data || []).map((goal) => {
    const daysLeft = Math.ceil(
      (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const monthsLeft = daysLeft / 30;
    const monthlyRequired = monthsLeft > 0 ? (goal.target_amount - goal.current_amount) / monthsLeft : 0;

    return {
      ...goal,
      daysLeft,
      progress,
      monthsLeft,
      monthlyRequired,
    };
  });
}
