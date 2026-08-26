/**
 * Turtle Bot Adapter - Non-custodial trading tool for Vault
 * Bridges Vault's impact analysis with Turtle Bot's execution
 */

import { supabaseAdmin } from './supabase.js';

export interface TradeRequest {
  userId: string;
  symbol: string;
  amount: number;
  strategy: 'sweep' | 'hunter' | 'accumulator' | 'sniper';
  reason: string; // Why Vault is requesting this trade
}

export interface TradeResult {
  status: 'pending' | 'executed' | 'failed';
  tradeId?: string;
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  message: string;
}

export interface TurtleBotConfig {
  brokerUrl: string;
  signerUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}

class TurtleBotAdapter {
  private config: TurtleBotConfig;

  constructor() {
    this.config = {
      brokerUrl: process.env.TURTLE_BOT_BROKER_URL || 'http://localhost:3000',
      signerUrl: process.env.TURTLE_BOT_SIGNER_URL || 'http://localhost:3001',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
    };
  }

  /**
   * Execute a trade via Turtle Bot
   * User must have connected their wallet first
   */
  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    try {
      // 1. Verify user has wallet connected
      const { data: wallet } = await supabaseAdmin
        .from('user_wallets')
        .select('address')
        .eq('user_id', request.userId)
        .single();

      if (!wallet) {
        return {
          status: 'failed',
          message: 'User wallet not connected. Please connect MetaMask first.',
        };
      }

      // 2. Call Turtle Bot Broker preflight check
      // This validates the trade parameters without executing
      const preflightResponse = await fetch(`${this.config.brokerUrl}/v1/intents/preflight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.userId}`, // JWT would go here
        },
        body: JSON.stringify({
          symbol: request.symbol,
          amount: request.amount,
          strategy: request.strategy,
          reason: request.reason,
        }),
      });

      if (!preflightResponse.ok) {
        return {
          status: 'failed',
          message: `Trade validation failed: ${preflightResponse.statusText}`,
        };
      }

      const preflightData = await preflightResponse.json();

      // 3. Store trade request for tracking
      const { data: trade } = await supabaseAdmin
        .from('vaultx_trades')
        .insert([
          {
            user_id: request.userId,
            wallet_address: wallet.address,
            symbol: request.symbol,
            amount: request.amount,
            strategy: request.strategy,
            reason: request.reason,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      // 4. Return pending status (actual execution happens in Turtle Bot)
      return {
        status: 'pending',
        tradeId: trade?.id,
        message: `Trade submitted to Turtle Bot. Awaiting execution on ${request.symbol}.`,
      };
    } catch (error) {
      console.error('Error executing trade via Turtle Bot:', error);
      return {
        status: 'failed',
        message: `Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get Turtle Bot's portfolio/positions
   * Vault uses this to check current holdings
   */
  async getPortfolio(userId: string): Promise<any> {
    try {
      const { data: wallet } = await supabaseAdmin
        .from('user_wallets')
        .select('address')
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        return null;
      }

      // Call Turtle Bot to get current positions
      const response = await fetch(`${this.config.brokerUrl}/v1/portfolio`, {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      });

      return response.ok ? response.json() : null;
    } catch (error) {
      console.error('Error fetching Turtle Bot portfolio:', error);
      return null;
    }
  }

  /**
   * Get trading history from Turtle Bot
   */
  async getTradingHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data: trades } = await supabaseAdmin
        .from('vaultx_trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return trades || [];
    } catch (error) {
      console.error('Error fetching trading history:', error);
      return [];
    }
  }

  /**
   * Check if user can afford to trade (from impact analysis perspective)
   */
  async canAffordTrade(userId: string, amount: number): Promise<boolean> {
    try {
      // Get user's financial metrics from Vault
      const response = await fetch(`http://localhost:4000/api/impact/metrics`, {
        headers: {
          Authorization: `Bearer test-token`, // In real app, use actual JWT
        },
      });

      if (!response.ok) return false;

      const data: any = await response.json();
      const { metrics } = data;

      // Can trade if monthly gap is positive (has surplus)
      return metrics.monthlyGap > amount;
    } catch (error) {
      console.error('Error checking trade affordability:', error);
      return false;
    }
  }

  /**
   * Get Turtle Bot's recommended strategy for given symbol
   */
  async getRecommendedStrategy(
    symbol: string
  ): Promise<'sweep' | 'hunter' | 'accumulator' | 'sniper'> {
    // Placeholder: In real implementation, query Turtle Bot's decision engine
    // For now, return a sensible default
    return 'sweep'; // Sweep strategy is safer/more balanced
  }
}

export const turtleBotAdapter = new TurtleBotAdapter();
