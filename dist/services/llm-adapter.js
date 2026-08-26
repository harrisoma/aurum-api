"use strict";
/**
 * LLM Adapter - Unified interface for multiple LLM providers
 * Supports: Claude (Anthropic), DeepSeek, OpenRouter
 * Configure via environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
exports.getLLMAdapter = getLLMAdapter;
class LLMAdapter {
    constructor(provider) {
        const selectedProvider = provider || process.env.LLM_PROVIDER || 'claude';
        this.config = this.getConfig(selectedProvider);
    }
    getConfig(provider) {
        switch (provider) {
            case 'deepseek':
                return {
                    provider: 'deepseek',
                    apiKey: process.env.DEEPSEEK_API_KEY || '',
                    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
                    baseUrl: 'https://api.deepseek.com/v1',
                };
            case 'openrouter':
                return {
                    provider: 'openrouter',
                    apiKey: process.env.OPENROUTER_API_KEY || '',
                    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-2-70b-chat',
                    baseUrl: 'https://openrouter.ai/api/v1',
                };
            case 'onyx':
                return {
                    provider: 'onyx',
                    apiKey: process.env.ONYX_API_KEY || '',
                    model: process.env.ONYX_MODEL || 'onyx',
                    baseUrl: process.env.ONYX_BASE_URL || 'https://api.onyx.ai/v1',
                };
            case 'generic-openai':
                return {
                    provider: 'generic-openai',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: process.env.OPENAI_MODEL || 'gpt-4',
                    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
                };
            case 'claude':
            default:
                return {
                    provider: 'claude',
                    apiKey: process.env.ANTHROPIC_API_KEY || '',
                    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
                };
        }
    }
    /**
     * Generate insights using configured LLM
     */
    async generateInsights(financialData, budgetStatus, forecastData) {
        const prompt = this.buildInsightsPrompt(financialData, budgetStatus, forecastData);
        switch (this.config.provider) {
            case 'deepseek':
                return this.callDeepSeek(prompt);
            case 'openrouter':
                return this.callOpenRouter(prompt);
            case 'claude':
            default:
                return this.callClaude(prompt);
        }
    }
    /**
     * Analyze decision impact using configured LLM
     */
    async analyzeDecision(scenarioName, financialImpact) {
        const prompt = this.buildDecisionPrompt(scenarioName, financialImpact);
        switch (this.config.provider) {
            case 'deepseek':
                return this.callDeepSeekText(prompt);
            case 'openrouter':
                return this.callOpenRouterText(prompt);
            case 'claude':
            default:
                return this.callClaudeText(prompt);
        }
    }
    /**
     * Generate monthly recommendations using configured LLM
     */
    async generateRecommendations(financialData, topCategories) {
        const prompt = this.buildRecommendationsPrompt(financialData, topCategories);
        switch (this.config.provider) {
            case 'deepseek':
                return this.callDeepSeekArray(prompt);
            case 'openrouter':
                return this.callOpenRouterArray(prompt);
            case 'claude':
            default:
                return this.callClaudeArray(prompt);
        }
    }
    // ===== Claude (Anthropic) =====
    async callClaude(prompt) {
        try {
            const Anthropic = require('@anthropic-ai/sdk').default;
            const client = new Anthropic({ apiKey: this.config.apiKey });
            const message = await client.messages.create({
                model: this.config.model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : '';
            return JSON.parse(text);
        }
        catch (error) {
            console.error('Claude error:', error);
            return this.getDefaultInsights();
        }
    }
    async callClaudeText(prompt) {
        try {
            const Anthropic = require('@anthropic-ai/sdk').default;
            const client = new Anthropic({ apiKey: this.config.apiKey });
            const message = await client.messages.create({
                model: this.config.model,
                max_tokens: 256,
                messages: [{ role: 'user', content: prompt }],
            });
            return message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze';
        }
        catch (error) {
            console.error('Claude error:', error);
            return 'Analysis unavailable';
        }
    }
    async callClaudeArray(prompt) {
        try {
            const Anthropic = require('@anthropic-ai/sdk').default;
            const client = new Anthropic({ apiKey: this.config.apiKey });
            const message = await client.messages.create({
                model: this.config.model,
                max_tokens: 256,
                messages: [{ role: 'user', content: prompt }],
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
            return JSON.parse(text);
        }
        catch (error) {
            console.error('Claude error:', error);
            return this.getDefaultRecommendations();
        }
    }
    // ===== DeepSeek =====
    async callDeepSeek(prompt) {
        return this.callOpenAICompatible(prompt, this.config.baseUrl || '');
    }
    async callDeepSeekText(prompt) {
        return this.callOpenAICompatibleText(prompt, this.config.baseUrl || '');
    }
    async callDeepSeekArray(prompt) {
        return this.callOpenAICompatibleArray(prompt, this.config.baseUrl || '');
    }
    // ===== OpenRouter =====
    async callOpenRouter(prompt) {
        return this.callOpenAICompatible(prompt, this.config.baseUrl || '');
    }
    async callOpenRouterText(prompt) {
        return this.callOpenAICompatibleText(prompt, this.config.baseUrl || '');
    }
    async callOpenRouterArray(prompt) {
        return this.callOpenAICompatibleArray(prompt, this.config.baseUrl || '');
    }
    // ===== OpenAI-Compatible API (for DeepSeek, OpenRouter, etc) =====
    async callOpenAICompatible(prompt, baseUrl) {
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });
            const data = (await response.json());
            const text = data.choices[0]?.message?.content || '';
            return JSON.parse(text);
        }
        catch (error) {
            console.error(`${this.config.provider} error:`, error);
            return this.getDefaultInsights();
        }
    }
    async callOpenAICompatibleText(prompt, baseUrl) {
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 256,
                }),
            });
            const data = (await response.json());
            return data.choices[0]?.message?.content || 'Unable to analyze';
        }
        catch (error) {
            console.error(`${this.config.provider} error:`, error);
            return 'Analysis unavailable';
        }
    }
    async callOpenAICompatibleArray(prompt, baseUrl) {
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 256,
                }),
            });
            const data = (await response.json());
            const text = data.choices[0]?.message?.content || '[]';
            return JSON.parse(text);
        }
        catch (error) {
            console.error(`${this.config.provider} error:`, error);
            return this.getDefaultRecommendations();
        }
    }
    // ===== Prompt Builders =====
    buildInsightsPrompt(financialData, budgetStatus, forecastData) {
        return `You are a financial advisor. Analyze this and provide 3-5 insights in JSON format.

FINANCIAL DATA:
- Net Worth: $${financialData.netWorth?.toFixed(2) || 0}
- Monthly Gap: $${financialData.monthlyGap?.toFixed(2) || 0}
- Velocity: ${financialData.velocity?.toFixed(1) || 0}%
- Runway: ${financialData.runway?.toFixed(0) || 0} days

Return only valid JSON array with objects: {category, insight, actionItems[], urgency}.`;
    }
    buildDecisionPrompt(scenarioName, impact) {
        return `Analyze this financial decision: ${scenarioName}

Impact:
- Net Worth: ${impact.netWorthImpact > 0 ? '+' : ''}$${impact.netWorthImpact.toFixed(2)}
- Runway: ${impact.runwayImpact > 0 ? '+' : ''}${impact.runwayImpact.toFixed(1)} days

Provide brief analysis (2-3 sentences) on whether this is advisable.`;
    }
    buildRecommendationsPrompt(financialData, topCategories) {
        return `Based on net worth $${financialData.netWorth?.toFixed(2) || 0}, monthly gap $${financialData.monthlyGap?.toFixed(2) || 0}, suggest 3 specific monthly actions for categories: ${topCategories.join(', ')}.

Return only JSON array: ["action1", "action2", "action3"]`;
    }
    // ===== Fallbacks =====
    getDefaultInsights() {
        return [
            {
                category: 'setup',
                insight: 'Set up budgets to get personalized recommendations',
                actionItems: ['Create budgets for main spending'],
                urgency: 'medium',
            },
        ];
    }
    getDefaultRecommendations() {
        return [
            'Create a budget for your top spending category',
            'Track daily spending for one week',
            'Review subscriptions and cancel unused services',
        ];
    }
    /**
     * Get current provider info
     */
    getProvider() {
        return this.config.provider;
    }
    getModel() {
        return this.config.model;
    }
}
exports.LLMAdapter = LLMAdapter;
/**
 * Factory function to get adapter with selected provider
 */
function getLLMAdapter(provider) {
    return new LLMAdapter(provider);
}
//# sourceMappingURL=llm-adapter.js.map