import axios from 'axios';
import { supabaseAdmin } from './supabase.js';

export interface CryptoWallet {
  address: string;
  blockchain: string;
  symbol: string;
  balance: number;
  valueUSD: number;
  lastUpdated: string;
}

export interface CryptoTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  symbol: string;
  date: string;
  type: 'send' | 'receive';
}

// Etherscan API for Ethereum
export const getEthereumBalance = async (address: string): Promise<CryptoWallet | null> => {
  try {
    const etherscanKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanKey) return null;

    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: etherscanKey,
      },
    });

    if (response.data.status !== '1') return null;

    const balanceWei = parseFloat(response.data.result);
    const balanceETH = balanceWei / 1e18;

    // Get ETH price in USD
    const priceResponse = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
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
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error);
    return null;
  }
};

// CoinGecko for price data (free, no API key needed)
export const getCryptoPrice = async (coinId: string): Promise<number> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coinId,
        vs_currencies: 'usd',
      },
    });

    return response.data[coinId]?.usd || 0;
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error);
    return 0;
  }
};

// Get Ethereum transactions
export const getEthereumTransactions = async (
  address: string,
  startBlock: number = 0
): Promise<CryptoTransaction[]> => {
  try {
    const etherscanKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanKey) return [];

    const response = await axios.get('https://api.etherscan.io/api', {
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

    if (response.data.status !== '1') return [];

    const ethPrice = await getCryptoPrice('ethereum');

    return response.data.result
      .slice(0, 100) // Limit to last 100 transactions
      .map((tx: any) => {
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
  } catch (error) {
    console.error('Error fetching Ethereum transactions:', error);
    return [];
  }
};

// Kraken API for portfolio
export const getKrakenBalance = async (apiKey: string, privateKey: string): Promise<CryptoWallet[]> => {
  try {
    // Would implement actual Kraken API call
    // Requires HMAC-SHA512 signing
    return [];
  } catch (error) {
    console.error('Error fetching Kraken balance:', error);
    return [];
  }
};

// Store wallet in Vault
export const saveWallet = async (
  userId: string,
  address: string,
  blockchain: string,
  data: CryptoWallet
): Promise<void> => {
  try {
    await supabaseAdmin.from('crypto_wallets').upsert(
      [
        {
          user_id: userId,
          address,
          blockchain,
          symbol: data.symbol,
          balance: data.balance,
          value_usd: data.valueUSD,
          last_updated: data.lastUpdated,
        },
      ],
      { onConflict: 'user_id,address,blockchain' }
    );
  } catch (error) {
    console.error('Error saving wallet:', error);
    throw error;
  }
};

// Get user's total crypto value
export const getUserCryptoNetWorth = async (userId: string): Promise<number> => {
  try {
    const { data: wallets } = await supabaseAdmin
      .from('crypto_wallets')
      .select('value_usd')
      .eq('user_id', userId);

    if (!wallets) return 0;

    return wallets.reduce((sum, w) => sum + (w.value_usd || 0), 0);
  } catch (error) {
    console.error('Error calculating crypto net worth:', error);
    return 0;
  }
};
