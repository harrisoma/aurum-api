import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = express.Router();

// GET /api/budget - Get current budget allocation
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get income total
    const { data: incomeData } = await supabase
      .from('income')
      .select('amount')
      .eq('user_id', userId);
    const totalIncome = (incomeData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    // Get liabilities total
    const { data: liabilityData } = await supabase
      .from('liabilities')
      .select('amount')
      .eq('user_id', userId);
    const totalLiabilities = (liabilityData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    // Get expenses total
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId);
    const totalExpenses = (expenseData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    const remaining = totalIncome - totalLiabilities - totalExpenses;

    res.json({
      income: totalIncome,
      liabilities: totalLiabilities,
      expenses: totalExpenses,
      remaining,
      status: remaining >= 0 ? 'healthy' : 'deficit',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budget/allocate - Allocate budget
router.post('/allocate', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { category, amount, description } = req.body;
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine which table based on category
    let table = 'expenses';
    if (category === 'liability') table = 'liabilities';
    if (category === 'savings') table = 'savings';

    const { data, error } = await supabase
      .from(table)
      .insert([
        {
          user_id: userId,
          name: category,
          amount,
          description,
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

// GET /api/budget/forecast - Get budget forecast
router.get('/forecast', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get current budget
    const { data: incomeData } = await supabase
      .from('income')
      .select('amount, frequency')
      .eq('user_id', userId);

    const { data: liabilityData } = await supabase
      .from('liabilities')
      .select('amount')
      .eq('user_id', userId);

    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId);

    const totalIncome = (incomeData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalLiabilities = (liabilityData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = (expenseData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    const forecast = {
      monthly: {
        income: totalIncome,
        liabilities: totalLiabilities,
        expenses: totalExpenses,
        remaining: totalIncome - totalLiabilities - totalExpenses,
      },
      annual: {
        income: totalIncome * 12,
        liabilities: totalLiabilities * 12,
        expenses: totalExpenses * 12,
        remaining: (totalIncome - totalLiabilities - totalExpenses) * 12,
      },
      healthScore: (totalIncome - totalLiabilities - totalExpenses) / totalIncome,
    };

    res.json(forecast);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
