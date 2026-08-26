import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getHealthMetrics,
  getWorkouts,
  createHealthEntry,
  generateHealthInsights,
  getHealthRecommendations,
} from '../services/vitality.js';

const router = Router();

router.get('/metrics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const metrics = await getHealthMetrics(req.user.id);
    res.json({ metrics, count: metrics.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/workouts', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const workouts = await getWorkouts(req.user.id);
    res.json({ workouts, count: workouts.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

router.post('/metrics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { metricType, value, unit } = req.body;
    const entry = await createHealthEntry(req.user.id, metricType, value, unit);
    res.status(201).json({ entry, message: 'Health entry created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const insights = await generateHealthInsights(req.user.id);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/recommendations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const recommendations = await getHealthRecommendations(req.user.id);
    res.json({ recommendations, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const metrics = await getHealthMetrics(req.user.id);
    const workouts = await getWorkouts(req.user.id);
    res.json({
      summary: { totalMetrics: metrics.length, totalWorkouts: workouts.length },
      recentMetrics: metrics.slice(0, 7),
      recentWorkouts: workouts.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
