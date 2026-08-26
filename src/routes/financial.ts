import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getUserFinancialSnapshot,
  getUserAccounts,
  getUserTransactions,
  getUserGoals,
  calculateNetWorth,
  calculateMonthlyGap,
  calculateDailyBurnRate,
} from '../services/financial';

const router = Router();

/**
 * GET /financial/snapshot
 * Get complete financial snapshot for user with advanced metrics
 */
router.get('/snapshot', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await getUserFinancialSnapshot(req.user.id);
    res.json({
      ...snapshot,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

/**
 * GET /financial/net-worth
 * Get user's net worth
 */
router.get('/net-worth', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const netWorth = await calculateNetWorth(req.user.id);
    res.json({ netWorth });
  } catch (error) {
    console.error('Error calculating net worth:', error);
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
});

/**
 * GET /financial/gap
 * Get monthly gap (income - expenses)
 */
router.get('/gap', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const gap = await calculateMonthlyGap(req.user.id);
    res.json({ monthlyGap: gap });
  } catch (error) {
    console.error('Error calculating gap:', error);
    res.status(500).json({ error: 'Failed to calculate gap' });
  }
});

/**
 * GET /financial/burn-rate
 * Get daily burn rate (average daily spending)
 */
router.get('/burn-rate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const burnRate = await calculateDailyBurnRate(req.user.id, days);
    res.json({ dailyBurnRate: burnRate, period: days });
  } catch (error) {
    console.error('Error calculating burn rate:', error);
    res.status(500).json({ error: 'Failed to calculate burn rate' });
  }
});

/**
 * GET /financial/accounts
 * Get all user accounts
 */
router.get('/accounts', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accounts = await getUserAccounts(req.user.id);
    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /financial/transactions
 * Get user's recent transactions
 */
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await getUserTransactions(req.user.id, limit);
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /financial/goals
 * Get user's goals with progress
 */
router.get('/goals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goals = await getUserGoals(req.user.id);
    res.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

/**
 * GET /financial/trends
 * Get historical financial trends
 */
router.get('/trends', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await (require('../services/supabase').supabaseAdmin as any)
      .from('monthly_financial_summary')
      .select('*')
      .eq('user_id', req.user.id)
      .order('month', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error fetching trends:', error);
      return res.status(500).json({ error: 'Failed to fetch trends' });
    }

    res.json({
      trends: data || [],
      count: (data || []).length,
    });
  } catch (error) {
    console.error('Error in trends endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * GET /financial/category-breakdown
 * Get spending by category
 */
router.get('/category-breakdown', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await (require('../services/supabase').supabaseAdmin as any)
      .from('transactions')
      .select('category, amount')
      .eq('user_id', req.user.id)
      .lt('amount', 0);

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    const breakdown = (data || []).reduce(
      (acc: Record<string, number>, txn: any) => {
        const cat = txn.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + Math.abs(txn.amount || 0);
        return acc;
      },
      {}
    );

    res.json({
      breakdown,
      totalSpent: Object.values(breakdown).reduce((a: number, b: any) => a + b, 0),
    });
  } catch (error) {
    console.error('Error in category breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

/**
 * GET /financial/runway-forecast
 * Get days of runway and forecast
 */
router.get('/runway-forecast', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await getUserFinancialSnapshot(req.user.id);

    res.json({
      runway: snapshot.runway,
      runwayDays: Math.floor(snapshot.runway),
      runwayMonths: Math.round((snapshot.runway / 30) * 10) / 10,
      velocity: snapshot.velocity,
      status: snapshot.runway < 0 ? 'sustainable' : snapshot.runway < 30 ? 'critical' : 'healthy',
      alert: snapshot.runway > 0 && snapshot.runway < 30 ? true : false,
    });
  } catch (error) {
    console.error('Error in runway forecast:', error);
    res.status(500).json({ error: 'Failed to fetch runway forecast' });
  }
});

export default router;
