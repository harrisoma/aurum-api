import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getConnections, createConnection, recordInteraction, getRelationshipInsights } from '../services/circle.js';

const router = Router();

router.get('/connections', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const connections = await getConnections(req.user.id);
    res.json({ connections, count: connections.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

router.post('/connections', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, relationship } = req.body;
    const connection = await createConnection(req.user.id, name, relationship);
    res.status(201).json({ connection, message: `Added ${name} to your circle` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.post('/interactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { connectionId, note } = req.body;
    const interaction = await recordInteraction(req.user.id, connectionId, note);
    res.status(201).json({ interaction, message: 'Interaction recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const insights = await getRelationshipInsights(req.user.id);
    res.json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const connections = await getConnections(req.user.id);
    res.json({
      summary: { totalConnections: connections.length },
      connections: connections.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
