"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPlaidData = exports.getTransactions = exports.getAccounts = exports.exchangePublicToken = exports.getLinkToken = exports.plaidClient = void 0;
const plaid_1 = require("plaid");
const supabase_js_1 = require("./supabase.js");
const plaidConfig = new plaid_1.Configuration({
    basePath: plaid_1.PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
            'PLAID-SECRET': process.env.PLAID_SECRET || '',
        },
    },
});
exports.plaidClient = new plaid_1.PlaidApi(plaidConfig);
// Get link token for user to connect Plaid
const getLinkToken = async (userId) => {
    try {
        const response = await exports.plaidClient.linkTokenCreate({
            user: { client_user_id: userId },
            client_name: 'Vault',
            language: 'en',
            products: ['auth', 'transactions'],
            country_codes: ['US'],
        });
        return response.data.link_token;
    }
    catch (error) {
        console.error('Error creating link token:', error);
        throw error;
    }
};
exports.getLinkToken = getLinkToken;
// Exchange public token for access token
const exchangePublicToken = async (userId, publicToken) => {
    try {
        const response = await exports.plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;
        // Store access token in database
        await supabase_js_1.supabaseAdmin.from('plaid_items').insert([
            {
                user_id: userId,
                item_id: itemId,
                access_token: accessToken,
                created_at: new Date().toISOString(),
            },
        ]);
        return accessToken;
    }
    catch (error) {
        console.error('Error exchanging public token:', error);
        throw error;
    }
};
exports.exchangePublicToken = exchangePublicToken;
// Get accounts for user
const getAccounts = async (userId) => {
    try {
        // Get access tokens from database
        const { data: items } = await supabase_js_1.supabaseAdmin
            .from('plaid_items')
            .select('access_token')
            .eq('user_id', userId);
        if (!items || items.length === 0) {
            return [];
        }
        const accounts = [];
        for (const item of items) {
            const response = await exports.plaidClient.accountsGet({
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
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        return [];
    }
};
exports.getAccounts = getAccounts;
// Get transactions
const getTransactions = async (userId, startDate, endDate) => {
    try {
        // Get access tokens from database
        const { data: items } = await supabase_js_1.supabaseAdmin
            .from('plaid_items')
            .select('access_token')
            .eq('user_id', userId);
        if (!items || items.length === 0) {
            return [];
        }
        const transactions = [];
        for (const item of items) {
            const response = await exports.plaidClient.transactionsGet({
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
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
};
exports.getTransactions = getTransactions;
// Sync user's Plaid accounts and transactions to Vault
const syncPlaidData = async (userId) => {
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString()
            .split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        const accounts = await (0, exports.getAccounts)(userId);
        const transactions = await (0, exports.getTransactions)(userId, startDate, endDate);
        // Store accounts
        for (const account of accounts) {
            await supabase_js_1.supabaseAdmin.from('plaid_accounts').upsert([
                {
                    user_id: userId,
                    account_id: account.accountId,
                    name: account.name,
                    type: account.type,
                    balance: account.currentBalance,
                    updated_at: new Date().toISOString(),
                },
            ], { onConflict: 'user_id,account_id' });
        }
        // Store transactions
        for (const txn of transactions) {
            await supabase_js_1.supabaseAdmin.from('plaid_transactions').upsert([
                {
                    user_id: userId,
                    transaction_id: txn.id,
                    date: txn.date,
                    amount: txn.amount,
                    description: txn.description,
                    category: txn.category[0] || 'other',
                    merchant: txn.merchant,
                },
            ], { onConflict: 'user_id,transaction_id' });
        }
        console.log(`Synced ${accounts.length} accounts and ${transactions.length} transactions`);
    }
    catch (error) {
        console.error('Error syncing Plaid data:', error);
        throw error;
    }
};
exports.syncPlaidData = syncPlaidData;
//# sourceMappingURL=plaid-service.js.map