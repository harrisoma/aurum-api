"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const crypto_service_js_1 = require("../services/crypto-service.js");
const supabase_js_1 = require("../services/supabase.js");
const router = (0, express_1.Router)();
// GET /crypto/prices - Get current crypto prices
router.get('/prices', async (req, res) => {
    try {
        const symbols = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'];
        const prices = {};
        for (const symbol of symbols) {
            prices[symbol] = await (0, crypto_service_js_1.getCryptoPrice)(symbol);
        }
        res.json({
            prices,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});
// POST /crypto/add-wallet - Add Ethereum address to track
router.post('/add-wallet', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { address, blockchain = 'ethereum' } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Missing wallet address' });
        }
        // Fetch balance
        let walletData;
        if (blockchain === 'ethereum') {
            walletData = await (0, crypto_service_js_1.getEthereumBalance)(address);
        }
        if (!walletData) {
            return res.status(400).json({ error: 'Invalid address or blockchain' });
        }
        // Save to database
        await (0, crypto_service_js_1.saveWallet)(req.user.id, address, blockchain, walletData);
        res.json({
            success: true,
            wallet: walletData,
            message: `${blockchain} wallet added successfully`,
        });
    }
    catch (error) {
        console.error('Error adding wallet:', error);
        res.status(500).json({ error: 'Failed to add wallet' });
    }
});
// GET /crypto/wallets - Get all tracked wallets
router.get('/wallets', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { data: wallets } = await supabase_js_1.supabaseAdmin
            .from('crypto_wallets')
            .select('*')
            .eq('user_id', req.user.id);
        res.json({
            wallets: wallets || [],
            count: wallets?.length || 0,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
});
// GET /crypto/transactions - Get wallet transactions
router.get('/transactions', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Missing wallet address' });
        }
        const transactions = await (0, crypto_service_js_1.getEthereumTransactions)(address);
        res.json({
            transactions,
            count: transactions.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
// GET /crypto/net-worth - Get total crypto value
router.get('/net-worth', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const netWorth = await (0, crypto_service_js_1.getUserCryptoNetWorth)(req.user.id);
        res.json({
            totalValueUSD: netWorth,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error calculating net worth:', error);
        res.status(500).json({ error: 'Failed to calculate net worth' });
    }
});
// POST /crypto/sync - Sync all wallets
router.post('/sync', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { data: wallets } = await supabase_js_1.supabaseAdmin
            .from('crypto_wallets')
            .select('address, blockchain')
            .eq('user_id', req.user.id);
        if (!wallets || wallets.length === 0) {
            return res.json({ message: 'No wallets to sync', synced: 0 });
        }
        let synced = 0;
        for (const wallet of wallets) {
            if (wallet.blockchain === 'ethereum') {
                const balanceData = await (0, crypto_service_js_1.getEthereumBalance)(wallet.address);
                if (balanceData) {
                    await (0, crypto_service_js_1.saveWallet)(req.user.id, wallet.address, wallet.blockchain, balanceData);
                    synced++;
                }
            }
        }
        res.json({
            success: true,
            synced,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error syncing wallets:', error);
        res.status(500).json({ error: 'Failed to sync wallets' });
    }
});
exports.default = router;
//# sourceMappingURL=crypto.js.map