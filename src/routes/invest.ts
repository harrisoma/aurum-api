import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = express.Router();

// GET /api/invest/portfolio - Get investment portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const portfolio = {
      investments: data || [],
      summary: {
        totalValue: (data || []).reduce((sum, item) => sum + (item.current_value || 0), 0),
        totalCost: (data || []).reduce((sum, item) => sum + (item.cost_basis || 0), 0),
        unrealizedGain: 0,
      },
    };

    portfolio.summary.unrealizedGain =
      portfolio.summary.totalValue - portfolio.summary.totalCost;

    res.json(portfolio);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invest/trade - Record investment transaction
router.post('/trade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { symbol, type, amount, price, investment_type } = req.body;
    if (!symbol || !type || amount === undefined || !investment_type) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, type, amount, investment_type',
      });
    }

    const { data, error } = await supabase
      .from('investments')
      .insert([
        {
          user_id: userId,
          symbol,
          type,
          quantity: amount,
          cost_basis: amount * (price || 0),
          current_value: amount * (price || 0),
          investment_type,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invest/performance - Get investment performance
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const performance = {
      totalInvested: (data || []).reduce((sum, item) => sum + (item.cost_basis || 0), 0),
      currentValue: (data || []).reduce((sum, item) => sum + (item.current_value || 0), 0),
      returnByType: {},
    };

    const types = ['long_term', 'short_term'];
    for (const type of types) {
      const typeData = (data || []).filter((item) => item.investment_type === type);
      const invested = typeData.reduce((sum, item) => sum + (item.cost_basis || 0), 0);
      const current = typeData.reduce((sum, item) => sum + (item.current_value || 0), 0);
      performance.returnByType[type] = {
        invested,
        current,
        gain: current - invested,
        percentage: invested > 0 ? ((current - invested) / invested) * 100 : 0,
      };
    }

    res.json(performance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invest/turtlebot-status - Check Turtlebot trading bot status
router.get('/turtlebot-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // TODO: Integrate with Turtlebot API
    // For now, return placeholder status
    res.json({
      status: 'connected',
      message: 'Turtlebot trading bot available as fallback income source',
      note: 'Configure Turtlebot API credentials to enable automated trading',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
