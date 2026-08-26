import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getFinancialMetrics,
  analyzeDecisionImpact,
  getAffordabilityPath,
} from '../services/impact-engine.js';

const router = Router();

// GET /impact/metrics - Get user's financial metrics
router.get('/metrics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const metrics = await getFinancialMetrics(req.user.id);

    res.json({
      metrics,
      summary: {
        financially_healthy: metrics.monthlyGap > 0,
        sustainability: metrics.velocity > 100 ? 'overspending' : 'sustainable',
        runway_days: metrics.runway,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch financial metrics' });
  }
});

// POST /impact/analyze - Analyze impact of a decision
router.post('/analyze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { description, amount, category } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({
        error: 'Missing required fields: description, amount, category',
      });
    }

    const impact = await analyzeDecisionImpact(req.user.id, description, amount, category);

    res.json({
      decision: description,
      amount,
      impact,
      timestamp: new Date().toISOString(),
      message: 'Decision impact analyzed across all life dimensions',
    });
  } catch (error) {
    console.error('Error analyzing decision:', error);
    res.status(500).json({ error: 'Failed to analyze decision impact' });
  }
});

// POST /impact/affordability - Get paths to afford something
router.post('/affordability', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, description } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields: amount, description',
      });
    }

    const paths = await getAffordabilityPath(req.user.id, amount, description);

    res.json({
      decision: description,
      amount,
      paths,
      message: `Here are ${paths.length} ways to afford ${description}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting affordability paths:', error);
    res.status(500).json({ error: 'Failed to get affordability paths' });
  }
});

// GET /impact/dashboard - Complete impact dashboard
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const metrics = await getFinancialMetrics(req.user.id);

    res.json({
      financialSnapshot: metrics,
      health: {
        netWorth: metrics.netWorth,
        monthlyGap: metrics.monthlyGap,
        runway: metrics.runway,
        velocity: metrics.velocity,
        status:
          metrics.monthlyGap > 0
            ? metrics.velocity > 80
              ? 'warning'
              : 'healthy'
            : 'critical',
      },
      recommendations: [
        metrics.runway < 100
          ? '⚠️ Low runway: prioritize income or reduce expenses'
          : '✓ Healthy runway',
        metrics.velocity > 100 ? '⚠️ Spending exceeds income' : '✓ Sustainable spending',
        metrics.monthlyGap > 0 && metrics.monthlyGap < 500
          ? '⚠️ Small cushion: limit discretionary spending'
          : '✓ Comfortable gap',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
