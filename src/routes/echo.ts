import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getLegacyItems, createLegacyItem, getMemories, recordMemory, getLegacyInsights } from '../services/echo.js';

const router = Router();

router.get('/legacy', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const items = await getLegacyItems(req.user.id);
    res.json({ items, count: items.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch legacy items' });
  }
});

router.post('/legacy', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, category } = req.body;
    const item = await createLegacyItem(req.user.id, title, description, category);
    res.status(201).json({ item, message: 'Legacy item documented' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create legacy item' });
  }
});

router.get('/memories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const memories = await getMemories(req.user.id);
    res.json({ memories, count: memories.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

router.post('/memories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { title, content, memoryDate } = req.body;
    const memory = await recordMemory(req.user.id, title, content, memoryDate);
    res.status(201).json({ memory, message: 'Memory recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record memory' });
  }
});

router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const insights = await getLegacyInsights(req.user.id);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const items = await getLegacyItems(req.user.id);
    const memories = await getMemories(req.user.id);
    res.json({
      summary: { legacyItems: items.length, memories: memories.length },
      recentItems: items.slice(0, 5),
      recentMemories: memories.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
