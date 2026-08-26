export interface UserFinancialSnapshot {
    netWorth: number;
    monthlyGap: number;
    dailyBurnRate: number;
    accountsCount: number;
    goalsCount: number;
    runway: number;
    velocity: number;
}
export interface Account {
    id: string;
    type: 'crypto' | 'bank' | 'payment_app' | 'trading';
    platform: string;
    balance: number;
    currency: string;
    lastSync: string;
}
export interface Transaction {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
}
export interface FinancialMetrics {
    assets: number;
    liabilities: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyGap: number;
    burnRate: number;
    runway: number;
    velocity: number;
}
export declare function getAdvancedMetrics(userId: string): Promise<FinancialMetrics>;
export declare function calculateNetWorth(userId: string): Promise<number>;
export declare function calculateMonthlyGap(userId: string): Promise<number>;
export declare function calculateDailyBurnRate(userId: string, days?: number): Promise<number>;
export declare function getUserFinancialSnapshot(userId: string): Promise<UserFinancialSnapshot>;
export declare function getUserAccounts(userId: string): Promise<Account[]>;
export declare function getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
export declare function getUserGoals(userId: string): Promise<any[]>;
//# sourceMappingURL=financial.d.ts.map