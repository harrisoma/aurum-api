-- Crypto Wallets
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  blockchain text NOT NULL,
  symbol text NOT NULL,
  balance numeric NOT NULL,
  value_usd numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, address, blockchain)
);

-- Crypto Transactions (optional - for history tracking)
CREATE TABLE IF NOT EXISTS crypto_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  blockchain text NOT NULL,
  transaction_hash text NOT NULL,
  from_address text,
  to_address text,
  value numeric NOT NULL,
  symbol text NOT NULL,
  transaction_date date NOT NULL,
  transaction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, transaction_hash)
);

-- Enable RLS
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "crypto_wallets_user_isolation" ON crypto_wallets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "crypto_transactions_user_isolation" ON crypto_transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX crypto_wallets_user_id_idx ON crypto_wallets(user_id);
CREATE INDEX crypto_wallets_blockchain_idx ON crypto_wallets(blockchain);
CREATE INDEX crypto_transactions_user_id_idx ON crypto_transactions(user_id);
CREATE INDEX crypto_transactions_date_idx ON crypto_transactions(transaction_date DESC);
