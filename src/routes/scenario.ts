import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { analyzeScenario, saveScenario, getHolisticImpact } from '../services/scenario.js';

const router = Router();

/**
 * POST /scenario/analyze
 * Analyze how a decision affects financial position
 */
router.post('/analyze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, amount, category, timeframe } = req.body;

    if (!type || amount === undefined) {
      return res.status(400).json({ error: 'type and amount required' });
    }

    const analysis = await analyzeScenario(req.user.id, {
      name: name || `${type}: $${amount}`,
      type,
      amount,
      category,
      timeframe,
    });

    res.json({
      scenario: { name, type, amount, category, timeframe },
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing scenario:', error);
    res.status(500).json({ error: 'Failed to analyze scenario' });
  }
});

/**
 * POST /scenario/save
 * Save scenario analysis for comparison
 */
router.post('/save', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, amount, category } = req.body;

    const analysis = await analyzeScenario(req.user.id, {
      name,
      type,
      amount,
      category,
    });

    const scenario = await saveScenario(req.user.id, { name, type, amount, category }, analysis);

    res.status(201).json({
      scenario,
      analysis,
      message: 'Scenario saved successfully',
    });
  } catch (error) {
    console.error('Error saving scenario:', error);
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

/**
 * POST /scenario/impact
 * Get holistic impact across all 7 life dimensions
 */
router.post('/impact', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, amount, category } = req.body;

    const holisticImpact = await getHolisticImpact(req.user.id, {
      name,
      type,
      amount,
      category,
    });

    // Calculate overall score (currently just financial, will expand)
    const overallScore = holisticImpact.financial.status === 'proceed' ? 8 :
                        holisticImpact.financial.status === 'caution' ? 5 : 2;

    res.json({
      decision: {
        type,
        amount,
        category,
      },
      impacts: holisticImpact,
      overallScore: `${overallScore}/10`,
      recommendation: holisticImpact.financial.impact.recommendation,
      reasoning: holisticImpact.financial.impact.reasoning,
      dimensionsAnalyzed: 1, // Currently 1 (financial), will expand to 7
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating impact:', error);
    res.status(500).json({ error: 'Failed to calculate impact' });
  }
});

export default router;
