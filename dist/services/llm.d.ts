export interface VaultInsight {
    category: string;
    insight: string;
    actionItems: string[];
    urgency: 'low' | 'medium' | 'high';
}
/**
 * Use Claude to generate smart financial insights
 */
export declare function generateVaultInsights(financialData: any, budgetStatus: any, forecastData: any): Promise<VaultInsight[]>;
/**
 * Analyze a purchase decision with AI reasoning
 */
export declare function analyzeDecisionWithAI(scenarioName: string, financialImpact: any): Promise<string>;
/**
 * Generate monthly financial recommendations
 */
export declare function generateMonthlyRecommendations(financialData: any, topCategories: string[]): Promise<string[]>;
//# sourceMappingURL=llm.d.ts.map