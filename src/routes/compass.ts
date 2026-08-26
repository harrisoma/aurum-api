import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getCareerGoals,
  getUserSkills,
  createCareerGoal,
  generateCareerInsights,
  getCareerRecommendations,
  addSkillEndorsement,
} from '../services/compass.js';
import { getLLMAdapter } from '../services/llm-adapter.js';

const router = Router();

// GET /compass/goals - Get user's career goals
router.get('/goals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const goals = await getCareerGoals(req.user.id);

    res.json({
      goals,
      count: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch career goals' });
  }
});

// GET /compass/skills - Get user's skills
router.get('/skills', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const skills = await getUserSkills(req.user.id);

    res.json({
      skills,
      totalSkills: skills.length,
      averageProficiency:
        skills.length > 0
          ? (skills.reduce((sum, s) => sum + s.proficiency_level, 0) / skills.length).toFixed(1)
          : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// POST /compass/goals - Create career goal
router.post('/goals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, targetDate, priority } = req.body;

    if (!title || !targetDate) {
      return res.status(400).json({ error: 'Title and targetDate required' });
    }

    const goal = await createCareerGoal(req.user.id, title, description, targetDate, priority);

    if (!goal) {
      return res.status(500).json({ error: 'Failed to create goal' });
    }

    res.status(201).json({
      goal,
      message: `Created goal: ${title}`,
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// GET /compass/insights - AI-powered career insights
router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const insights = await generateCareerInsights(req.user.id);
    const llm = getLLMAdapter();

    res.json({
      insights,
      provider: llm.getProvider(),
      model: llm.getModel(),
      timestamp: new Date().toISOString(),
      message: 'AI-powered career insights generated',
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// GET /compass/recommendations - Career recommendations
router.get('/recommendations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const recommendations = await getCareerRecommendations(req.user.id);

    res.json({
      recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /compass/dashboard - Compass dashboard
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const goals = await getCareerGoals(req.user.id);
    const skills = await getUserSkills(req.user.id);
    const insights = await generateCareerInsights(req.user.id);
    const recommendations = await getCareerRecommendations(req.user.id);

    res.json({
      summary: {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalSkills: skills.length,
        averageProficiency:
          skills.length > 0
            ? (skills.reduce((sum, s) => sum + s.proficiency_level, 0) / skills.length).toFixed(1)
            : 0,
      },
      recentGoals: goals.slice(0, 5),
      topSkills: skills.slice(0, 3),
      insights: insights.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
