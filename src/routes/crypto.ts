import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getEthereumBalance,
  getEthereumTransactions,
  getCryptoPrice,
  saveWallet,
  getUserCryptoNetWorth,
} from '../services/crypto-service.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// GET /crypto/prices - Get current crypto prices
router.get('/prices', async (req, res) => {
  try {
    const symbols = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'];
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      prices[symbol] = await getCryptoPrice(symbol);
    }

    res.json({
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// POST /crypto/add-wallet - Add Ethereum address to track
router.post('/add-wallet', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { address, blockchain = 'ethereum' } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // Fetch balance
    let walletData;
    if (blockchain === 'ethereum') {
      walletData = await getEthereumBalance(address);
    }

    if (!walletData) {
      return res.status(400).json({ error: 'Invalid address or blockchain' });
    }

    // Save to database
    await saveWallet(req.user.id, address, blockchain, walletData);

    res.json({
      success: true,
      wallet: walletData,
      message: `${blockchain} wallet added successfully`,
    });
  } catch (error) {
    console.error('Error adding wallet:', error);
    res.status(500).json({ error: 'Failed to add wallet' });
  }
});

// GET /crypto/wallets - Get all tracked wallets
router.get('/wallets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: wallets } = await supabaseAdmin
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', req.user.id);

    res.json({
      wallets: wallets || [],
      count: wallets?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// GET /crypto/transactions - Get wallet transactions
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    const transactions = await getEthereumTransactions(address as string);

    res.json({
      transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /crypto/net-worth - Get total crypto value
router.get('/net-worth', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const netWorth = await getUserCryptoNetWorth(req.user.id);

    res.json({
      totalValueUSD: netWorth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating net worth:', error);
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
});

// POST /crypto/sync - Sync all wallets
router.post('/sync', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: wallets } = await supabaseAdmin
      .from('crypto_wallets')
      .select('address, blockchain')
      .eq('user_id', req.user.id);

    if (!wallets || wallets.length === 0) {
      return res.json({ message: 'No wallets to sync', synced: 0 });
    }

    let synced = 0;
    for (const wallet of wallets) {
      if (wallet.blockchain === 'ethereum') {
        const balanceData = await getEthereumBalance(wallet.address);
        if (balanceData) {
          await saveWallet(req.user.id, wallet.address, wallet.blockchain, balanceData);
          synced++;
        }
      }
    }

    res.json({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing wallets:', error);
    res.status(500).json({ error: 'Failed to sync wallets' });
  }
});

export default router;
