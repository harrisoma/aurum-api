/**
 * AURUM Bot Trading Strategies
 * Integrated from Turtle Bot + new Arbiter + Scout workflows
 *
 * Strategies:
 * - SWEEP: Liquidity sweep strategy (conservative, safe entries)
 * - HUNTER: Aggressive trend-following strategy
 * - SNIPER: High-precision entry strategy
 * - ACCUMULATOR: Dollar-cost averaging strategy
 * - ARBITER: Arbitrage across DEXs (buy low, sell high)
 * - SCOUT: Auto-discovery of best trading setups/symbols
 */

export type StrategyType = 'sweep' | 'hunter' | 'sniper' | 'accumulator' | 'arbiter' | 'scout';

export interface StrategyConfig {
  name: StrategyType;
  displayName: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  minAccountSize: number;
  recommendedTP_RR: number; // Target profit / Risk Ratio
  enableRetest: boolean;
  enableRejection: boolean;
  maxRungs: number;
  filters: {
    rsi_period: number;
    rsi_long_max: number;
    rsi_short_min: number;
    atr_period: number;
    atr_sma_period: number;
    min_atr_mult: number;
  };
  session_hours_utc: number[];
  enabled: boolean;
}

export const STRATEGIES: Record<StrategyType, StrategyConfig> = {
  sweep: {
    name: 'sweep',
    displayName: 'Liquidity Sweep',
    description: 'Conservative strategy targeting liquidity sweeps and order blocks. Safe entries with defined risk.',
    riskLevel: 'low',
    minAccountSize: 100,
    recommendedTP_RR: 2.5,
    enableRetest: true,
    enableRejection: true,
    maxRungs: 3,
    filters: {
      rsi_period: 14,
      rsi_long_max: 70,
      rsi_short_min: 30,
      atr_period: 14,
      atr_sma_period: 200,
      min_atr_mult: 1.5,
    },
    session_hours_utc: [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23], // US and Asian sessions
    enabled: true,
  },

  hunter: {
    name: 'hunter',
    displayName: 'Trend Hunter',
    description: 'Aggressive trend-following strategy. Enters strong momentum moves with higher risk/reward.',
    riskLevel: 'high',
    minAccountSize: 500,
    recommendedTP_RR: 3.0,
    enableRetest: false,
    enableRejection: false,
    maxRungs: 5,
    filters: {
      rsi_period: 14,
      rsi_long_max: 80,
      rsi_short_min: 20,
      atr_period: 10,
      atr_sma_period: 50,
      min_atr_mult: 2.0,
    },
    session_hours_utc: [8, 9, 10, 11, 12, 13, 14, 15, 16], // High volatility hours
    enabled: true,
  },

  sniper: {
    name: 'sniper',
    displayName: 'Sniper Entry',
    description: 'High-precision entry strategy. Waits for perfect setups with tight stops and explosive upside.',
    riskLevel: 'medium',
    minAccountSize: 250,
    recommendedTP_RR: 4.0,
    enableRetest: true,
    enableRejection: true,
    maxRungs: 2,
    filters: {
      rsi_period: 7,
      rsi_long_max: 75,
      rsi_short_min: 25,
      atr_period: 9,
      atr_sma_period: 100,
      min_atr_mult: 1.8,
    },
    session_hours_utc: [12, 13, 14, 15, 16, 17, 18], // Mid-day precision entries
    enabled: true,
  },

  accumulator: {
    name: 'accumulator',
    displayName: 'Accumulator DCA',
    description: 'Dollar-cost averaging strategy. Scales in gradually to reduce average entry price.',
    riskLevel: 'low',
    minAccountSize: 200,
    recommendedTP_RR: 2.0,
    enableRetest: true,
    enableRejection: false,
    maxRungs: 8, // More scale-ins
    filters: {
      rsi_period: 21,
      rsi_long_max: 65,
      rsi_short_min: 35,
      atr_period: 20,
      atr_sma_period: 300,
      min_atr_mult: 1.2,
    },
    session_hours_utc: [0, 1, 2, 3, 4, 5, 8, 9, 20, 21, 22, 23],
    enabled: true,
  },

  arbiter: {
    name: 'arbiter',
    displayName: 'DEX Arbitrage',
    description: 'Exploits price differences across Apex, Kraken, Coinbase. Buy low on one, sell high on another.',
    riskLevel: 'low',
    minAccountSize: 500,
    recommendedTP_RR: 1.2, // Lower ratio, but consistent
    enableRetest: false,
    enableRejection: false,
    maxRungs: 1, // Single execution
    filters: {
      rsi_period: 14,
      rsi_long_max: 70,
      rsi_short_min: 30,
      atr_period: 14,
      atr_sma_period: 200,
      min_atr_mult: 0.5,
    },
    session_hours_utc: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    enabled: true,
  },

  scout: {
    name: 'scout',
    displayName: 'Scout Discovery',
    description: 'AI workflow that scans all symbols and timeframes to find the BEST setup for the day.',
    riskLevel: 'medium',
    minAccountSize: 100,
    recommendedTP_RR: 2.5,
    enableRetest: true,
    enableRejection: true,
    maxRungs: 3,
    filters: {
      rsi_period: 14,
      rsi_long_max: 70,
      rsi_short_min: 30,
      atr_period: 14,
      atr_sma_period: 200,
      min_atr_mult: 1.5,
    },
    session_hours_utc: [8, 9, 10, 11, 12, 13, 14, 15, 16], // Active trading hours
    enabled: true,
  },
};

export interface ScoutSetup {
  symbol: string;
  strategy: StrategyType;
  confidence: number; // 0-100
  expectedReturn: number; // percentage
  riskLevel: string;
  timeframe: string;
  setup_description: string;
}

export interface StrategyRecommendation {
  symbol: string;
  recommendedStrategy: StrategyType;
  alternativeStrategies: StrategyType[];
  reason: string;
  confidence: number;
}

class StrategyEngine {
  /**
   * Get strategy by name
   */
  getStrategy(name: StrategyType): StrategyConfig {
    return STRATEGIES[name];
  }

  /**
   * List all available strategies
   */
  listStrategies(): StrategyConfig[] {
    return Object.values(STRATEGIES);
  }

  /**
   * Scout for best trading setups - AI-powered discovery
   * Scans multiple symbols and returns the best setup for today
   */
  async scoutBestSetups(symbols: string[], llmProvider: any): Promise<ScoutSetup[]> {
    try {
      const prompt = `You are a professional day trader. Analyze these symbols for the BEST trading setup TODAY:
Symbols: ${symbols.join(', ')}

For EACH symbol, determine:
1. Best strategy (sweep/hunter/sniper/accumulator/arbiter)
2. Confidence level (0-100)
3. Expected return %
4. Risk level
5. Timeframe to watch
6. Why this setup is strong

Return ONLY a JSON array with confidence > 70.`;

      const response = await llmProvider.call(prompt);
      const setups = JSON.parse(response);

      return setups.map((setup: any) => ({
        symbol: setup.symbol,
        strategy: setup.strategy as StrategyType,
        confidence: setup.confidence,
        expectedReturn: setup.expectedReturn,
        riskLevel: setup.risk_level,
        timeframe: setup.timeframe,
        setup_description: setup.setup_description,
      }));
    } catch (error) {
      console.error('Error scouting setups:', error);
      return [];
    }
  }

  /**
   * Recommend best strategy for a symbol based on market conditions
   */
  async recommendStrategy(
    symbol: string,
    marketData: any,
    llmProvider: any
  ): Promise<StrategyRecommendation> {
    try {
      const prompt = `As a trading AI, recommend the BEST strategy for ${symbol} right now.

Market data:
- RSI: ${marketData.rsi}
- ATR: ${marketData.atr}
- Price: ${marketData.price}
- Trend: ${marketData.trend}
- Volatility: ${marketData.volatility}

Available strategies: sweep (safe), hunter (aggressive), sniper (precise), accumulator (dca), arbiter (arbitrage)

Recommend ONE primary strategy + 2 alternatives with confidence 1-100.`;

      const response = await llmProvider.call(prompt);
      const rec = JSON.parse(response);

      return {
        symbol,
        recommendedStrategy: rec.primary as StrategyType,
        alternativeStrategies: rec.alternatives as StrategyType[],
        reason: rec.reason,
        confidence: rec.confidence,
      };
    } catch (error) {
      console.error('Error recommending strategy:', error);
      return {
        symbol,
        recommendedStrategy: 'sweep',
        alternativeStrategies: ['accumulator'],
        reason: 'Default recommendation due to error',
        confidence: 0,
      };
    }
  }

  /**
   * Get arbitrage opportunities - ARBITER strategy
   */
  async findArbitrageOpportunities(
    symbols: string[],
    priceData: Record<string, Record<string, number>>
  ): Promise<any[]> {
    const opportunities = [];

    for (const symbol of symbols) {
      const prices = priceData[symbol];
      if (!prices || Object.keys(prices).length < 2) continue;

      const exchanges = Object.keys(prices);
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = 0; j < exchanges.length; j++) {
          if (i === j) continue;

          const buyExchange = exchanges[i];
          const sellExchange = exchanges[j];
          const spread = ((prices[sellExchange] - prices[buyExchange]) / prices[buyExchange]) * 100;

          if (spread > 0.5) {
            // Min 0.5% profit after fees
            opportunities.push({
              symbol,
              buyExchange,
              sellExchange,
              buyPrice: prices[buyExchange],
              sellPrice: prices[sellExchange],
              spread: spread.toFixed(2),
              strategy: 'arbiter',
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => parseFloat(b.spread) - parseFloat(a.spread));
  }
}

export const strategyEngine = new StrategyEngine();
