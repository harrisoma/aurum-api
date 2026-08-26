import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getLinkToken,
  exchangePublicToken,
  getAccounts,
  getTransactions,
  syncPlaidData,
} from '../services/plaid-service.js';

const router = Router();

// GET /plaid/link-token - Get Plaid link token for frontend
router.get('/link-token', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const linkToken = await getLinkToken(req.user.id);

    res.json({
      link_token: linkToken,
      message: 'Use this token to initialize Plaid Link in your frontend',
    });
  } catch (error) {
    console.error('Error getting link token:', error);
    res.status(500).json({ error: 'Failed to get Plaid link token' });
  }
});

// POST /plaid/exchange-token - Exchange public token for access token
router.post('/exchange-token', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { publicToken } = req.body;
    if (!publicToken) {
      return res.status(400).json({ error: 'Missing publicToken' });
    }

    const accessToken = await exchangePublicToken(req.user.id, publicToken);

    // Sync data immediately after linking
    await syncPlaidData(req.user.id);

    res.json({
      success: true,
      message: 'Bank account linked successfully and data synced',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to link bank account' });
  }
});

// GET /plaid/accounts - Get all linked accounts
router.get('/accounts', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const accounts = await getAccounts(req.user.id);

    res.json({
      accounts,
      count: accounts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /plaid/transactions - Get recent transactions
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            endDate = new Date().toISOString().split('T')[0] } = req.query;

    const transactions = await getTransactions(
      req.user.id,
      startDate as string,
      endDate as string
    );

    res.json({
      transactions,
      count: transactions.length,
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /plaid/sync - Manually sync Plaid data
router.post('/sync', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await syncPlaidData(req.user.id);

    res.json({
      success: true,
      message: 'Plaid data synced successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing Plaid data:', error);
    res.status(500).json({ error: 'Failed to sync Plaid data' });
  }
});

export default router;
