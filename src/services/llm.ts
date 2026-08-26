import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export interface VaultInsight {
  category: string;
  insight: string;
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high';
}

/**
 * Use Claude to generate smart financial insights
 */
export async function generateVaultInsights(
  financialData: any,
  budgetStatus: any,
  forecastData: any
): Promise<VaultInsight[]> {
  try {
    const prompt = `You are a sophisticated financial advisor. Analyze this financial data and provide 3-5 specific, actionable insights.

FINANCIAL SNAPSHOT:
- Net Worth: $${financialData.netWorth?.toFixed(2) || 0}
- Monthly Gap: $${financialData.monthlyGap?.toFixed(2) || 0}
- Daily Burn Rate: $${financialData.dailyBurnRate?.toFixed(2) || 0}
- Velocity: ${financialData.velocity?.toFixed(1) || 0}% (spending as % of income)
- Runway: ${financialData.runway?.toFixed(0) || 0} days

BUDGET STATUS:
${budgetStatus && budgetStatus.length > 0
  ? budgetStatus.map((b: any) => `- ${b.category}: $${b.spentThisMonth.toFixed(2)}/$${b.budgeted.toFixed(2)} (${b.percentUsed.toFixed(0)}%)`).join('\n')
  : '- No budgets set up'}

FORECAST:
${forecastData && forecastData.length > 0
  ? forecastData.map((f: any) => `- ${f.category}: Projected $${f.projectedMonthEnd.toFixed(2)} (budget: $${f.budgeted.toFixed(2)})`).join('\n')
  : '- No forecast data'}

Provide insights in this JSON format:
[
  {
    "category": "spending",
    "insight": "Your velocity is above 100%, meaning you're spending more than you earn.",
    "actionItems": ["Reduce discretionary spending", "Increase income"],
    "urgency": "high"
  }
]

Only return valid JSON, no other text.`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const insights = JSON.parse(responseText);

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    // Fallback to basic insights
    return [
      {
        category: 'setup',
        insight: 'Set up your first budget to get personalized recommendations',
        actionItems: ['Create budgets for main spending categories'],
        urgency: 'medium',
      },
    ];
  }
}

/**
 * Analyze a purchase decision with AI reasoning
 */
export async function analyzeDecisionWithAI(
  scenarioName: string,
  financialImpact: any
): Promise<string> {
  try {
    const prompt = `You are a personal financial advisor analyzing a financial decision.

DECISION: ${scenarioName}

IMPACTS:
- Net Worth Change: $${financialImpact.netWorthImpact.toFixed(2)}
- Runway Impact: ${financialImpact.runwayImpact.toFixed(1)} days
- Velocity Impact: ${financialImpact.velocityImpact.toFixed(2)}%
- Budget Impact: $${financialImpact.budgetImpact.toFixed(2)}

Provide a brief, compelling analysis (2-3 sentences) on whether this decision is advisable. Be specific about the trade-offs.`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze decision';
  } catch (error) {
    console.error('Error analyzing decision:', error);
    return 'Analysis unavailable';
  }
}

/**
 * Generate monthly financial recommendations
 */
export async function generateMonthlyRecommendations(
  financialData: any,
  topCategories: string[]
): Promise<string[]> {
  try {
    const prompt = `Based on this financial profile, suggest 3 specific actions for this month:

Net Worth: $${financialData.netWorth?.toFixed(2)}
Monthly Income: $${(financialData.monthlyGap + financialData.monthlyExpenses)?.toFixed(2) || 0}
Monthly Expenses: $${financialData.monthlyExpenses?.toFixed(2) || 0}
Gap: $${financialData.monthlyGap?.toFixed(2)}

Top spending categories: ${topCategories.join(', ')}

Return only a JSON array of 3 action strings, no other text:
["action 1", "action 2", "action 3"]`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]';
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      'Create a budget for your top spending category',
      'Track daily spending for one week',
      'Review subscriptions and cancel unused services',
    ];
  }
}
