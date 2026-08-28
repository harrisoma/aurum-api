import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = express.Router();

// GET /api/credit/status - Get current credit status
router.get('/status', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('credit')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return res.json({ status: 'no_data', message: 'No credit report uploaded yet' });
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credit/upload - Upload credit report
router.post('/upload', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { credit_score, report_data, provider } = req.body;
    if (!credit_score || !report_data) {
      return res.status(400).json({ error: 'Missing required fields: credit_score, report_data' });
    }

    const { data, error } = await supabase
      .from('credit')
      .upsert(
        {
          user_id: userId,
          credit_score,
          report_data,
          provider: provider || 'annualcreditreport.com',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credit/guidance - Get AI-powered credit improvement guidance
router.get('/guidance', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get current credit status
    const { data: creditData, error: creditError } = await supabase
      .from('credit')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (creditError && creditError.code !== 'PGRST116') throw creditError;
    if (!creditData) {
      return res.json({
        guidance: 'Upload a credit report first to get personalized improvement guidance.',
      });
    }

    // TODO: Integrate with Claude API to generate personalized guidance
    // For now, return basic guidance structure
    const guidance = {
      score: creditData.credit_score,
      tier: creditData.credit_score >= 750 ? 'Excellent' :
            creditData.credit_score >= 670 ? 'Good' :
            creditData.credit_score >= 580 ? 'Fair' : 'Poor',
      recommendations: [
        'Review the detailed report for negative items',
        'Dispute any inaccuracies through Metro2 integration',
        'Generate automated dispute letters using AI',
        'Monitor progress over time',
      ],
    };

    res.json(guidance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/credit/disputes - Get dispute history
router.get('/disputes', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('credit_disputes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credit/dispute - Create a dispute
router.post('/dispute', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { item_type, description, reason } = req.body;
    if (!item_type || !reason) {
      return res.status(400).json({ error: 'Missing required fields: item_type, reason' });
    }

    const { data, error } = await supabase
      .from('credit_disputes')
      .insert([
        {
          user_id: userId,
          item_type,
          description,
          reason,
          status: 'pending',
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

export default router;
