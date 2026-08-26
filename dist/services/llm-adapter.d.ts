/**
 * LLM Adapter - Unified interface for multiple LLM providers
 * Supports: Claude (Anthropic), DeepSeek, OpenRouter
 * Configure via environment variables
 */
export type LLMProvider = 'claude' | 'deepseek' | 'openrouter' | 'onyx' | 'generic-openai';
export declare class LLMAdapter {
    private config;
    constructor(provider?: LLMProvider);
    private getConfig;
    /**
     * Generate insights using configured LLM
     */
    generateInsights(financialData: any, budgetStatus: any, forecastData: any): Promise<any[]>;
    /**
     * Analyze decision impact using configured LLM
     */
    analyzeDecision(scenarioName: string, financialImpact: any): Promise<string>;
    /**
     * Generate monthly recommendations using configured LLM
     */
    generateRecommendations(financialData: any, topCategories: string[]): Promise<string[]>;
    private callClaude;
    private callClaudeText;
    private callClaudeArray;
    private callDeepSeek;
    private callDeepSeekText;
    private callDeepSeekArray;
    private callOpenRouter;
    private callOpenRouterText;
    private callOpenRouterArray;
    private callOpenAICompatible;
    private callOpenAICompatibleText;
    private callOpenAICompatibleArray;
    private buildInsightsPrompt;
    private buildDecisionPrompt;
    private buildRecommendationsPrompt;
    private getDefaultInsights;
    private getDefaultRecommendations;
    /**
     * Get current provider info
     */
    getProvider(): LLMProvider;
    getModel(): string;
}
/**
 * Factory function to get adapter with selected provider
 */
export declare function getLLMAdapter(provider?: LLMProvider): LLMAdapter;
//# sourceMappingURL=llm-adapter.d.ts.map