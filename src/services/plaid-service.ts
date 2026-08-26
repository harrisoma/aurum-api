import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { supabaseAdmin } from './supabase.js';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

export const plaidClient = new PlaidApi(plaidConfig);

export interface PlaidAccount {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  currentBalance: number;
}

export interface PlaidTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string[];
  merchant: string | null;
}

// Get link token for user to connect Plaid
export const getLinkToken = async (userId: string): Promise<string> => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Vault',
      language: 'en',
      products: ['auth' as any, 'transactions' as any],
      country_codes: ['US' as any],
    });

    return response.data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
};

// Exchange public token for access token
export const exchangePublicToken = async (
  userId: string,
  publicToken: string
): Promise<string> => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Store access token in database
    await supabaseAdmin.from('plaid_items').insert([
      {
        user_id: userId,
        item_id: itemId,
        access_token: accessToken,
        created_at: new Date().toISOString(),
      },
    ]);

    return accessToken;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
};

// Get accounts for user
export const getAccounts = async (userId: string): Promise<PlaidAccount[]> => {
  try {
    // Get access tokens from database
    const { data: items } = await supabaseAdmin
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', userId);

    if (!items || items.length === 0) {
      return [];
    }

    const accounts: PlaidAccount[] = [];

    for (const item of items) {
      const response = await plaidClient.accountsGet({
        access_token: item.access_token,
      });

      response.data.accounts.forEach(account => {
        accounts.push({
          accountId: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype || '',
          mask: account.mask || '',
          currentBalance: account.balances.current || 0,
        });
      });
    }

    return accounts;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
};

// Get transactions
export const getTransactions = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<PlaidTransaction[]> => {
  try {
    // Get access tokens from database
    const { data: items } = await supabaseAdmin
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', userId);

    if (!items || items.length === 0) {
      return [];
    }

    const transactions: PlaidTransaction[] = [];

    for (const item of items) {
      const response = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: startDate,
        end_date: endDate,
      });

      response.data.transactions.forEach(txn => {
        transactions.push({
          id: txn.transaction_id,
          date: txn.date,
          amount: txn.amount,
          description: txn.name,
          category: txn.personal_finance_category?.primary
            ? [txn.personal_finance_category.primary]
            : [],
          merchant: txn.merchant_name || null,
        });
      });
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Sync user's Plaid accounts and transactions to Vault
export const syncPlaidData = async (userId: string): Promise<void> => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const accounts = await getAccounts(userId);
    const transactions = await getTransactions(userId, startDate, endDate);

    // Store accounts
    for (const account of accounts) {
      await supabaseAdmin.from('plaid_accounts').upsert(
        [
          {
            user_id: userId,
            account_id: account.accountId,
            name: account.name,
            type: account.type,
            balance: account.currentBalance,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,account_id' }
      );
    }

    // Store transactions
    for (const txn of transactions) {
      await supabaseAdmin.from('plaid_transactions').upsert(
        [
          {
            user_id: userId,
            transaction_id: txn.id,
            date: txn.date,
            amount: txn.amount,
            description: txn.description,
            category: txn.category[0] || 'other',
            merchant: txn.merchant,
          },
        ],
        { onConflict: 'user_id,transaction_id' }
      );
    }

    console.log(`Synced ${accounts.length} accounts and ${transactions.length} transactions`);
  } catch (error) {
    console.error('Error syncing Plaid data:', error);
    throw error;
  }
};
