import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getHabits, createHabit, logHabitCompletion, getHabitInsights } from '../services/foundation.js';

const router = Router();

router.get('/habits', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const habits = await getHabits(req.user.id);
    res.json({ habits, count: habits.length, active: habits.filter(h => h.status === 'active').length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

router.post('/habits', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { habitName, frequency, category } = req.body;
    const habit = await createHabit(req.user.id, habitName, frequency, category);
    res.status(201).json({ habit, message: `Started new habit: ${habitName}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

router.post('/habits/:id/log', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const log = await logHabitCompletion(req.user.id, habitId);
    res.status(201).json({ log, message: 'Habit logged! Keep it up! 💪' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const insights = await getHabitInsights(req.user.id);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const habits = await getHabits(req.user.id);
    res.json({
      summary: { total: habits.length, active: habits.filter(h => h.status === 'active').length },
      habits: habits.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
