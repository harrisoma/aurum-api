import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { Anthropic } from '@anthropic-ai/sdk';

const router = express.Router();
const anthropic = new Anthropic();

// GET /api/decision/snapshot - Get 7-dimensional financial health snapshot
router.get('/snapshot', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Gather all financial data
    const [incomeRes, liabilityRes, expenseRes, creditRes, assetRes, investRes] =
      await Promise.all([
        supabase.from('income').select('amount').eq('user_id', userId),
        supabase.from('liabilities').select('amount').eq('user_id', userId),
        supabase.from('expenses').select('amount').eq('user_id', userId),
        supabase.from('credit').select('credit_score').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).single(),
        supabase.from('assets').select('value').eq('user_id', userId),
        supabase.from('investments').select('current_value').eq('user_id', userId),
      ]);

    const totalIncome = (incomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalLiabilities = (liabilityRes.data || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalExpenses = (expenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const creditScore = creditRes.data?.credit_score || 0;
    const totalAssets = (assetRes.data || []).reduce((sum, item) => sum + (item.value || 0), 0);
    const totalInvested = (investRes.data || []).reduce(
      (sum, item) => sum + (item.current_value || 0),
      0
    );

    const snapshot = {
      income: totalIncome,
      liabilities: totalLiabilities,
      expenses: totalExpenses,
      assets: totalAssets,
      investments: totalInvested,
      creditScore,
      budgetHealth: totalIncome - totalLiabilities - totalExpenses,
      wealthHealth: totalAssets + totalInvested - totalLiabilities,
      timestamp: new Date().toISOString(),
    };

    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decision/analyze - Analyze financial decision impact
router.post('/analyze', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { decision, amount } = req.body;
    if (!decision || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: decision, amount' });
    }

    // Get current financial snapshot
    const [incomeRes, liabilityRes, expenseRes, creditRes] = await Promise.all([
      supabase.from('income').select('amount').eq('user_id', userId),
      supabase.from('liabilities').select('amount').eq('user_id', userId),
      supabase.from('expenses').select('amount').eq('user_id', userId),
      supabase.from('credit').select('credit_score').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).single(),
    ]);

    const totalIncome = (incomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalLiabilities = (liabilityRes.data || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalExpenses = (expenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const creditScore = creditRes.data?.credit_score || 0;

    // Use Claude to analyze decision impact
    const prompt = `You are a financial advisor analyzing a potential decision impact on someone's finances.

Current Financial Status:
- Monthly Income: $${totalIncome}
- Monthly Liabilities: $${totalLiabilities}
- Monthly Expenses: $${totalExpenses}
- Credit Score: ${creditScore}
- Monthly Surplus/Deficit: $${totalIncome - totalLiabilities - totalExpenses}

Decision Being Analyzed: "${decision}"
Amount Impact: $${amount}

Provide a brief analysis (2-3 sentences) of:
1. Impact on monthly budget
2. Feasibility given current finances
3. Recommendation

Keep response concise and actionable.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : '';

    res.json({
      decision,
      amount,
      currentSurplus: totalIncome - totalLiabilities - totalExpenses,
      impactedSurplus: totalIncome - totalLiabilities - totalExpenses - amount,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decision/guidance - Get personalized financial guidance
router.get('/guidance', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get financial snapshot
    const [incomeRes, liabilityRes, expenseRes, creditRes, assetRes] = await Promise.all([
      supabase.from('income').select('amount').eq('user_id', userId),
      supabase.from('liabilities').select('amount').eq('user_id', userId),
      supabase.from('expenses').select('amount').eq('user_id', userId),
      supabase.from('credit').select('credit_score').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).single(),
      supabase.from('assets').select('*').eq('user_id', userId),
    ]);

    const totalIncome = (incomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalLiabilities = (liabilityRes.data || []).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalExpenses = (expenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const creditScore = creditRes.data?.credit_score || 0;

    // Generate guidance using Claude
    const prompt = `You are a personal financial advisor. Based on the following financial profile, provide 3 specific, actionable recommendations to improve financial health:

Financial Profile:
- Monthly Income: $${totalIncome}
- Monthly Liabilities: $${totalLiabilities}
- Monthly Expenses: $${totalExpenses}
- Credit Score: ${creditScore}
- Monthly Surplus/Deficit: $${totalIncome - totalLiabilities - totalExpenses}

Provide recommendations in JSON format with this structure:
{
  "recommendations": [
    {"priority": 1, "action": "...", "impact": "..."},
    {"priority": 2, "action": "...", "impact": "..."},
    {"priority": 3, "action": "...", "impact": "..."}
  ],
  "overallHealth": "poor|fair|good|excellent"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      const guidance = JSON.parse(content);
      res.json(guidance);
    } catch {
      res.json({ guidance: content });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
