-- Plaid Items (stores access tokens and metadata)
CREATE TABLE IF NOT EXISTS plaid_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  access_token text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Plaid Accounts (stores bank accounts from Plaid)
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  subtype text,
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Plaid Transactions (stores transactions from Plaid)
CREATE TABLE IF NOT EXISTS plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text,
  merchant text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, transaction_id)
);

-- Enable RLS
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "plaid_items_user_isolation" ON plaid_items
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "plaid_accounts_user_isolation" ON plaid_accounts
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "plaid_transactions_user_isolation" ON plaid_transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX plaid_items_user_id_idx ON plaid_items(user_id);
CREATE INDEX plaid_accounts_user_id_idx ON plaid_accounts(user_id);
CREATE INDEX plaid_transactions_user_id_idx ON plaid_transactions(user_id);
CREATE INDEX plaid_transactions_date_idx ON plaid_transactions(date DESC);
