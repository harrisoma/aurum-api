/**
 * LLM Adapter - Unified interface for multiple LLM providers
 * Supports: Claude (Anthropic), DeepSeek, OpenRouter
 * Configure via environment variables
 */

export type LLMProvider = 'claude' | 'deepseek' | 'openrouter' | 'onyx' | 'generic-openai';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class LLMAdapter {
  private config: LLMConfig;

  constructor(provider?: LLMProvider) {
    const selectedProvider = provider || (process.env.LLM_PROVIDER as LLMProvider) || 'claude';

    this.config = this.getConfig(selectedProvider);
  }

  private getConfig(provider: LLMProvider): LLMConfig {
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
  async generateInsights(
    financialData: any,
    budgetStatus: any,
    forecastData: any
  ): Promise<any[]> {
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
  async analyzeDecision(scenarioName: string, financialImpact: any): Promise<string> {
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
  async generateRecommendations(
    financialData: any,
    topCategories: string[]
  ): Promise<string[]> {
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
  private async callClaude(prompt: string): Promise<any[]> {
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
    } catch (error) {
      console.error('Claude error:', error);
      return this.getDefaultInsights();
    }
  }

  private async callClaudeText(prompt: string): Promise<string> {
    try {
      const Anthropic = require('@anthropic-ai/sdk').default;
      const client = new Anthropic({ apiKey: this.config.apiKey });

      const message = await client.messages.create({
        model: this.config.model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze';
    } catch (error) {
      console.error('Claude error:', error);
      return 'Analysis unavailable';
    }
  }

  private async callClaudeArray(prompt: string): Promise<string[]> {
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
    } catch (error) {
      console.error('Claude error:', error);
      return this.getDefaultRecommendations();
    }
  }

  // ===== DeepSeek =====
  private async callDeepSeek(prompt: string): Promise<any[]> {
    return this.callOpenAICompatible(prompt, this.config.baseUrl || '');
  }

  private async callDeepSeekText(prompt: string): Promise<string> {
    return this.callOpenAICompatibleText(prompt, this.config.baseUrl || '');
  }

  private async callDeepSeekArray(prompt: string): Promise<string[]> {
    return this.callOpenAICompatibleArray(prompt, this.config.baseUrl || '');
  }

  // ===== OpenRouter =====
  private async callOpenRouter(prompt: string): Promise<any[]> {
    return this.callOpenAICompatible(prompt, this.config.baseUrl || '');
  }

  private async callOpenRouterText(prompt: string): Promise<string> {
    return this.callOpenAICompatibleText(prompt, this.config.baseUrl || '');
  }

  private async callOpenRouterArray(prompt: string): Promise<string[]> {
    return this.callOpenAICompatibleArray(prompt, this.config.baseUrl || '');
  }

  // ===== OpenAI-Compatible API (for DeepSeek, OpenRouter, etc) =====
  private async callOpenAICompatible(prompt: string, baseUrl: string): Promise<any[]> {
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

      const data = (await response.json()) as any;
      const text = data.choices[0]?.message?.content || '';
      return JSON.parse(text);
    } catch (error) {
      console.error(`${this.config.provider} error:`, error);
      return this.getDefaultInsights();
    }
  }

  private async callOpenAICompatibleText(prompt: string, baseUrl: string): Promise<string> {
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

      const data = (await response.json()) as any;
      return data.choices[0]?.message?.content || 'Unable to analyze';
    } catch (error) {
      console.error(`${this.config.provider} error:`, error);
      return 'Analysis unavailable';
    }
  }

  private async callOpenAICompatibleArray(prompt: string, baseUrl: string): Promise<string[]> {
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

      const data = (await response.json()) as any;
      const text = data.choices[0]?.message?.content || '[]';
      return JSON.parse(text);
    } catch (error) {
      console.error(`${this.config.provider} error:`, error);
      return this.getDefaultRecommendations();
    }
  }

  // ===== Prompt Builders =====
  private buildInsightsPrompt(financialData: any, budgetStatus: any, forecastData: any): string {
    return `You are a financial advisor. Analyze this and provide 3-5 insights in JSON format.

FINANCIAL DATA:
- Net Worth: $${financialData.netWorth?.toFixed(2) || 0}
- Monthly Gap: $${financialData.monthlyGap?.toFixed(2) || 0}
- Velocity: ${financialData.velocity?.toFixed(1) || 0}%
- Runway: ${financialData.runway?.toFixed(0) || 0} days

Return only valid JSON array with objects: {category, insight, actionItems[], urgency}.`;
  }

  private buildDecisionPrompt(scenarioName: string, impact: any): string {
    return `Analyze this financial decision: ${scenarioName}

Impact:
- Net Worth: ${impact.netWorthImpact > 0 ? '+' : ''}$${impact.netWorthImpact.toFixed(2)}
- Runway: ${impact.runwayImpact > 0 ? '+' : ''}${impact.runwayImpact.toFixed(1)} days

Provide brief analysis (2-3 sentences) on whether this is advisable.`;
  }

  private buildRecommendationsPrompt(financialData: any, topCategories: string[]): string {
    return `Based on net worth $${financialData.netWorth?.toFixed(2) || 0}, monthly gap $${financialData.monthlyGap?.toFixed(2) || 0}, suggest 3 specific monthly actions for categories: ${topCategories.join(', ')}.

Return only JSON array: ["action1", "action2", "action3"]`;
  }

  // ===== Fallbacks =====
  private getDefaultInsights(): any[] {
    return [
      {
        category: 'setup',
        insight: 'Set up budgets to get personalized recommendations',
        actionItems: ['Create budgets for main spending'],
        urgency: 'medium',
      },
    ];
  }

  private getDefaultRecommendations(): string[] {
    return [
      'Create a budget for your top spending category',
      'Track daily spending for one week',
      'Review subscriptions and cancel unused services',
    ];
  }

  /**
   * Get current provider info
   */
  getProvider(): LLMProvider {
    return this.config.provider;
  }

  getModel(): string {
    return this.config.model;
  }
}

/**
 * Factory function to get adapter with selected provider
 */
export function getLLMAdapter(provider?: LLMProvider): LLMAdapter {
  return new LLMAdapter(provider);
}
