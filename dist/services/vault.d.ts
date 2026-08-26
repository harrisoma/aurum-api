interface BudgetRecommendation {
    category: string;
    recommendedAmount: number;
    historicalAvg: number;
    historicalStdDev: number;
    reasoning: string;
    confidenceScore: number;
}
interface BudgetStatus {
    category: string;
    budgeted: number;
    spentThisMonth: number;
    remaining: number;
    percentUsed: number;
    status: 'healthy' | 'warning' | 'critical';
}
interface BudgetForecast {
    category: string;
    projectedMonthEnd: number;
    budgeted: number;
    variance: number;
    percentageOverUnder: number;
    daysRemaining: number;
    dailyBurnRate: number;
}
export declare function generateBudgetRecommendations(userId: string): Promise<BudgetRecommendation[]>;
export declare function getBudgetStatus(userId: string): Promise<BudgetStatus[]>;
export declare function forecastBudgets(userId: string): Promise<BudgetForecast[]>;
export declare function checkBudgetAlerts(userId: string): Promise<any[]>;
export declare function createBudget(userId: string, category: string, monthlyAmount: number, rules?: any[]): Promise<any>;
export {};
//# sourceMappingURL=vault.d.ts.map