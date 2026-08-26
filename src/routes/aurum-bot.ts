import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { aurumBot } from '../services/aurum-bot.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// POST /trading/execute - Execute a standard trade
router.post('/execute', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, amount, strategy, reason } = req.body;

    if (!symbol || !amount || !strategy) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, amount, strategy',
      });
    }

    const canAfford = await aurumBot.canAffordTrade(req.user.id, amount);
    if (!canAfford) {
      return res.status(400).json({
        error: 'Insufficient funds. Trade would exceed budget.',
      });
    }

    const result = await aurumBot.executeTrade({
      userId: req.user.id,
      symbol,
      amount,
      strategy,
      reason: reason || `Trading to earn`,
    });

    res.json({
      success: result.status !== 'failed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: 'Failed to execute trade' });
  }
});

// POST /trading/arbitrage/find - Find arbitrage opportunities
router.post('/arbitrage/find', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, minProfitPercent = 1 } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Missing required field: symbol' });
    }

    const opportunities = await aurumBot.findArbitrageOpportunities(symbol, minProfitPercent);

    res.json({
      symbol,
      opportunities,
      count: opportunities.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error finding arbitrage:', error);
    res.status(500).json({ error: 'Failed to find arbitrage opportunities' });
  }
});

// POST /trading/arbitrage/execute - Execute arbitrage trade
router.post('/arbitrage/execute', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, amount, minProfitPercent = 1 } = req.body;

    if (!symbol || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, amount',
      });
    }

    const result = await aurumBot.executeArbitrageTrade(req.user.id, symbol, amount, minProfitPercent);

    res.json({
      success: result.status !== 'failed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error executing arbitrage:', error);
    res.status(500).json({ error: 'Failed to execute arbitrage trade' });
  }
});

// POST /trading/prices - Get prices across exchanges
router.post('/prices', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Missing required field: symbol' });
    }

    const prices = await aurumBot.getPricesAcrossExchanges(symbol);

    res.json({
      symbol,
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// GET /trading/portfolio - Get user's trading portfolio
router.get('/portfolio', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const portfolio = await aurumBot.getPortfolio(req.user.id);

    res.json({
      portfolio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// GET /trading/history - Get trading history
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { limit = 50 } = req.query;
    const history = await aurumBot.getTradingHistory(
      req.user.id,
      parseInt(limit as string)
    );

    res.json({
      trades: history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch trading history' });
  }
});

// POST /trading/connect-wallet - Connect user's wallet
router.post('/connect-wallet', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { walletAddress, walletType } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing walletAddress' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_wallets')
      .upsert(
        [
          {
            user_id: req.user.id,
            address: walletAddress,
            type: walletType || 'metamask',
            connected_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    res.json({
      success: true,
      message: `Wallet ${walletAddress} connected successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// GET /trading/strategies - List all available strategies
router.get('/strategies', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { strategyEngine } = await import('../services/strategies.js');
    const strategies = strategyEngine.listStrategies();

    res.json({
      strategies,
      count: strategies.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// POST /trading/scout/discover - Scout AI discovers best setups for the day
router.post('/scout/discover', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'symbols array required' });
    }

    const { strategyEngine } = await import('../services/strategies.js');
    const { getLLMAdapter } = await import('../services/llm-adapter.js');

    const llmAdapter = getLLMAdapter();
    const setups = await strategyEngine.scoutBestSetups(symbols, llmAdapter);

    res.json({
      count: setups.length,
      setups,
      message: `Scout found ${setups.length} high-confidence setups for ${symbols.join(', ')}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error scouting setups:', error);
    res.status(500).json({ error: 'Failed to scout setups' });
  }
});

// POST /trading/scout/recommend - Get strategy recommendation for a symbol
router.post('/scout/recommend', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, marketData } = req.body;
    if (!symbol || !marketData) {
      return res.status(400).json({ error: 'symbol and marketData required' });
    }

    const { strategyEngine } = await import('../services/strategies.js');
    const { getLLMAdapter } = await import('../services/llm-adapter.js');

    const llmAdapter = getLLMAdapter();
    const recommendation = await strategyEngine.recommendStrategy(symbol, marketData, llmAdapter);

    res.json({
      symbol,
      recommendation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recommending strategy:', error);
    res.status(500).json({ error: 'Failed to recommend strategy' });
  }
});

// GET /trading/status - Check AURUM Bot service status
router.get('/status', async (req, res) => {
  res.json({
    status: 'online',
    service: 'AURUM Bot',
    exchanges: ['apex', 'kraken', 'coinbase'],
    strategies: ['sweep', 'hunter', 'sniper', 'accumulator', 'arbiter', 'scout'],
    features: ['trading', 'arbitrage', 'ai-discovery', 'ai-recommendations'],
    timestamp: new Date().toISOString(),
  });
});

export default router;
