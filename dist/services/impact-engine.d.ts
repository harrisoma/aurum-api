export interface FinancialMetrics {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyGap: number;
    runway: number;
    velocity: number;
    budgetedTotal: number;
    spentThisMonth: number;
}
export interface LifeImpact {
    financial: {
        netWorthChange: number;
        runwayChange: number;
        budgetImpact: number;
        affordability: 'easily' | 'challenging' | 'not possible';
        recommendation: string;
    };
    physical: {
        impact: string;
        benefit: number;
        reasoning: string;
    };
    emotional: {
        impact: string;
        benefit: number;
        reasoning: string;
    };
    career: {
        impact: string;
        benefit: number;
        reasoning: string;
    };
    relationships: {
        impact: string;
        benefit: number;
        reasoning: string;
    };
    overall: {
        isWorthIt: boolean;
        score: number;
        alternatives: string[];
        recommendation: string;
    };
}
export declare const getFinancialMetrics: (userId: string) => Promise<FinancialMetrics>;
export declare const analyzeDecisionImpact: (userId: string, description: string, amount: number, category: string) => Promise<LifeImpact>;
export declare const getAffordabilityPath: (userId: string, amount: number, description: string) => Promise<string[]>;
//# sourceMappingURL=impact-engine.d.ts.map