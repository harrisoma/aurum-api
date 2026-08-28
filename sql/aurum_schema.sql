-- AURUM 5-Pillar Wealth Management Schema
-- Created: 2026-08-28
-- Purpose: Minimal, focused schema for Assets, Income, Credit, Budget, Invest pillars

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- Profiles (user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 1. ASSETS PILLAR - Home, Car, Life Insurance
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('home', 'car', 'life_insurance', 'other')),
  name VARCHAR(255) NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

-- 2. INCOME PILLAR - Job, Business, Side Gigs, Child Support, Investments
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  income_type VARCHAR(50) NOT NULL CHECK (income_type IN ('job', 'business', 'side_gig', 'child_support', 'investment', 'other')),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  frequency VARCHAR(50) DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own income" ON income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON income FOR DELETE USING (auth.uid() = user_id);

-- 3. CREDIT PILLAR - Credit Reports, Scores, Disputes
CREATE TABLE IF NOT EXISTS credit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  credit_score INT,
  report_data JSONB,
  provider VARCHAR(100) DEFAULT 'annualcreditreport.com',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credit" ON credit FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit" ON credit FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit" ON credit FOR UPDATE USING (auth.uid() = user_id);

-- Credit Disputes
CREATE TABLE IF NOT EXISTS credit_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'responded', 'resolved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE credit_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own disputes" ON credit_disputes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own disputes" ON credit_disputes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own disputes" ON credit_disputes FOR UPDATE USING (auth.uid() = user_id);

-- 4. BUDGET PILLAR - Income vs Liabilities vs Expenses
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(50) DEFAULT 'other',
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Savings
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own savings" ON savings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings" ON savings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings" ON savings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings" ON savings FOR DELETE USING (auth.uid() = user_id);

-- 5. INVEST PILLAR - Long-term & Short-term Investments
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('stock', 'bond', 'mutual_fund', 'etf', 'crypto', 'other')),
  quantity DECIMAL(12, 6),
  cost_basis DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  investment_type VARCHAR(50) NOT NULL CHECK (investment_type IN ('long_term', 'short_term')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON investments FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_credit_user_id ON credit(user_id);
CREATE INDEX idx_credit_disputes_user_id ON credit_disputes(user_id);
CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_savings_user_id ON savings(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX idx_assets_created_at ON assets(created_at);
CREATE INDEX idx_income_created_at ON income(created_at);
CREATE INDEX idx_credit_created_at ON credit(created_at);
CREATE INDEX idx_investments_created_at ON investments(created_at);
