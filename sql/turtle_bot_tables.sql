-- User Wallets (Web3 connections)
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  type text DEFAULT 'metamask',
  connected_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Turtle Bot Trades
CREATE TABLE IF NOT EXISTS turtle_bot_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  symbol text NOT NULL,
  amount numeric NOT NULL,
  strategy text NOT NULL,
  reason text,
  status text DEFAULT 'pending',
  trade_id text,
  entry_price numeric,
  exit_price numeric,
  pnl numeric,
  created_at timestamp with time zone DEFAULT now(),
  executed_at timestamp with time zone,
  closed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE turtle_bot_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "user_wallets_user_isolation" ON user_wallets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "turtle_bot_trades_user_isolation" ON turtle_bot_trades
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX user_wallets_user_id_idx ON user_wallets(user_id);
CREATE INDEX turtle_bot_trades_user_id_idx ON turtle_bot_trades(user_id);
CREATE INDEX turtle_bot_trades_status_idx ON turtle_bot_trades(status);
CREATE INDEX turtle_bot_trades_created_at_idx ON turtle_bot_trades(created_at DESC);
