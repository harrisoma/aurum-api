import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getMilestones, createMilestone, completeMilestone, getMilestoneInsights } from '../services/summit.js';

const router = Router();

router.get('/milestones', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const milestones = await getMilestones(req.user.id);
    const completed = milestones.filter(m => m.status === 'completed').length;
    res.json({ milestones, completed, pending: milestones.length - completed, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

router.post('/milestones', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, targetDate, category } = req.body;
    const milestone = await createMilestone(req.user.id, title, targetDate, category);
    res.status(201).json({ milestone, message: 'Milestone created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

router.post('/milestones/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const milestoneId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const milestone = await completeMilestone(req.user.id, milestoneId);
    res.json({ milestone, message: 'Milestone completed! 🎉' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete milestone' });
  }
});

router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const insights = await getMilestoneInsights(req.user.id);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const milestones = await getMilestones(req.user.id);
    res.json({
      summary: { total: milestones.length, completed: milestones.filter(m => m.status === 'completed').length },
      upcoming: milestones.filter(m => m.status === 'active').slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
