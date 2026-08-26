interface ScenarioInput {
    name: string;
    type: 'purchase' | 'income_change' | 'goal_change' | 'spending_reduction';
    amount: number;
    category?: string;
    timeframe?: string;
}
interface ImpactAnalysis {
    netWorthImpact: number;
    runwayImpact: number;
    velocityImpact: number;
    budgetImpact: number;
    goalProgressImpact: number;
    recommendation: 'proceed' | 'caution' | 'reconsider';
    reasoning: string;
}
/**
 * Analyze how a decision affects all 7 life dimensions
 */
export declare function analyzeScenario(userId: string, scenario: ScenarioInput): Promise<ImpactAnalysis>;
/**
 * Save scenario analysis for later reference
 */
export declare function saveScenario(userId: string, scenario: ScenarioInput, analysis: ImpactAnalysis): Promise<any>;
/**
 * Get impact across all 7 life dimensions (extensible for other modules)
 */
export declare function getHolisticImpact(userId: string, scenario: ScenarioInput): Promise<{
    financial: {
        impact: ImpactAnalysis;
        status: "proceed" | "caution" | "reconsider";
    };
    health: {
        impact: null;
        status: string;
    };
    relationships: {
        impact: null;
        status: string;
    };
    career: {
        impact: null;
        status: string;
    };
    habits: {
        impact: null;
        status: string;
    };
    goals: {
        impact: null;
        status: string;
    };
    legacy: {
        impact: null;
        status: string;
    };
}>;
export {};
//# sourceMappingURL=scenario.d.ts.map