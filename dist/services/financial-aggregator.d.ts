/**
 * Financial Aggregator - Connects to multiple financial data sources
 * Supports: Plaid (banks, credit cards), Crypto APIs, Stock APIs, Tax APIs
 */
export interface PlaidConfig {
    clientId: string;
    secret: string;
    environment: 'sandbox' | 'development' | 'production';
}
export interface CryptoWallet {
    address: string;
    blockchain: string;
    balance: number;
    valueUSD: number;
}
export interface StockAccount {
    accountId: string;
    broker: string;
    holdings: Array<{
        symbol: string;
        shares: number;
        currentPrice: number;
        totalValue: number;
    }>;
    totalValue: number;
}
export interface AggregatedTransaction {
    id: string;
    source: 'plaid' | 'crypto' | 'stock' | 'tax' | 'manual';
    date: string;
    description: string;
    amount: number;
    category: string;
    account: string;
    metadata: Record<string, any>;
}
export interface FinancialSnapshot {
    timestamp: string;
    accounts: Array<{
        name: string;
        type: string;
        balance: number;
        institution: string;
    }>;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    recentTransactions: AggregatedTransaction[];
}
declare class FinancialAggregator {
    private plaidConfig?;
    private cryptoApiKeys;
    private stockApiKeys;
    constructor();
    private initializeFromEnv;
    /**
     * Get Plaid link token for user to connect bank accounts
     */
    getPlaidLinkToken(userId: string): Promise<string>;
    /**
     * Exchange Plaid public token for access token
     */
    exchangePlaidToken(userId: string, publicToken: string): Promise<string>;
    /**
     * Get Plaid transactions
     */
    getPlaidTransactions(userId: string, accessToken: string, startDate: string, endDate: string): Promise<AggregatedTransaction[]>;
    /**
     * Get crypto wallet balance
     */
    getCryptoBalance(userId: string, walletAddress: string): Promise<CryptoWallet>;
    /**
     * Get stock portfolio
     */
    getStockPortfolio(userId: string, brokerage: string): Promise<StockAccount>;
    /**
     * Get aggregated financial snapshot
     */
    getAggregatedSnapshot(userId: string): Promise<FinancialSnapshot>;
    /**
     * Setup webhook for real-time transaction updates
     */
    setupWebhook(userId: string, webhookUrl: string): Promise<boolean>;
}
export declare const financialAggregator: FinancialAggregator;
export {};
//# sourceMappingURL=financial-aggregator.d.ts.map