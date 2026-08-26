"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCryptoNetWorth = exports.saveWallet = exports.getKrakenBalance = exports.getEthereumTransactions = exports.getCryptoPrice = exports.getEthereumBalance = void 0;
const axios_1 = __importDefault(require("axios"));
const supabase_js_1 = require("./supabase.js");
// Etherscan API for Ethereum
const getEthereumBalance = async (address) => {
    try {
        const etherscanKey = process.env.ETHERSCAN_API_KEY;
        if (!etherscanKey)
            return null;
        const response = await axios_1.default.get('https://api.etherscan.io/api', {
            params: {
                module: 'account',
                action: 'balance',
                address,
                tag: 'latest',
                apikey: etherscanKey,
            },
        });
        if (response.data.status !== '1')
            return null;
        const balanceWei = parseFloat(response.data.result);
        const balanceETH = balanceWei / 1e18;
        // Get ETH price in USD
        const priceResponse = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPrice = priceResponse.data.ethereum.usd;
        const valueUSD = balanceETH * ethPrice;
        return {
            address,
            blockchain: 'ethereum',
            symbol: 'ETH',
            balance: balanceETH,
            valueUSD,
            lastUpdated: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error fetching Ethereum balance:', error);
        return null;
    }
};
exports.getEthereumBalance = getEthereumBalance;
// CoinGecko for price data (free, no API key needed)
const getCryptoPrice = async (coinId) => {
    try {
        const response = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: coinId,
                vs_currencies: 'usd',
            },
        });
        return response.data[coinId]?.usd || 0;
    }
    catch (error) {
        console.error(`Error fetching ${coinId} price:`, error);
        return 0;
    }
};
exports.getCryptoPrice = getCryptoPrice;
// Get Ethereum transactions
const getEthereumTransactions = async (address, startBlock = 0) => {
    try {
        const etherscanKey = process.env.ETHERSCAN_API_KEY;
        if (!etherscanKey)
            return [];
        const response = await axios_1.default.get('https://api.etherscan.io/api', {
            params: {
                module: 'account',
                action: 'txlist',
                address,
                startblock: startBlock,
                endblock: 99999999,
                sort: 'desc',
                apikey: etherscanKey,
            },
        });
        if (response.data.status !== '1')
            return [];
        const ethPrice = await (0, exports.getCryptoPrice)('ethereum');
        return response.data.result
            .slice(0, 100) // Limit to last 100 transactions
            .map((tx) => {
            const valueETH = parseFloat(tx.value) / 1e18;
            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: valueETH,
                symbol: 'ETH',
                date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
                type: tx.to.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
            };
        });
    }
    catch (error) {
        console.error('Error fetching Ethereum transactions:', error);
        return [];
    }
};
exports.getEthereumTransactions = getEthereumTransactions;
// Kraken API for portfolio
const getKrakenBalance = async (apiKey, privateKey) => {
    try {
        // Would implement actual Kraken API call
        // Requires HMAC-SHA512 signing
        return [];
    }
    catch (error) {
        console.error('Error fetching Kraken balance:', error);
        return [];
    }
};
exports.getKrakenBalance = getKrakenBalance;
// Store wallet in Vault
const saveWallet = async (userId, address, blockchain, data) => {
    try {
        await supabase_js_1.supabaseAdmin.from('crypto_wallets').upsert([
            {
                user_id: userId,
                address,
                blockchain,
                symbol: data.symbol,
                balance: data.balance,
                value_usd: data.valueUSD,
                last_updated: data.lastUpdated,
            },
        ], { onConflict: 'user_id,address,blockchain' });
    }
    catch (error) {
        console.error('Error saving wallet:', error);
        throw error;
    }
};
exports.saveWallet = saveWallet;
// Get user's total crypto value
const getUserCryptoNetWorth = async (userId) => {
    try {
        const { data: wallets } = await supabase_js_1.supabaseAdmin
            .from('crypto_wallets')
            .select('value_usd')
            .eq('user_id', userId);
        if (!wallets)
            return 0;
        return wallets.reduce((sum, w) => sum + (w.value_usd || 0), 0);
    }
    catch (error) {
        console.error('Error calculating crypto net worth:', error);
        return 0;
    }
};
exports.getUserCryptoNetWorth = getUserCryptoNetWorth;
//# sourceMappingURL=crypto-service.js.map