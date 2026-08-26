"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAffordabilityPath = exports.analyzeDecisionImpact = exports.getFinancialMetrics = void 0;
const supabase_js_1 = require("./supabase.js");
const llm_adapter_js_1 = require("./llm-adapter.js");
// Get user's complete financial picture
const getFinancialMetrics = async (userId) => {
    // Get financial data from vault
    const { data: budgets } = await supabase_js_1.supabaseAdmin
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
    const { data: trends } = await supabase_js_1.supabaseAdmin
        .from('user_financial_trends')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: false })
        .limit(1)
        .single();
    const budgetedTotal = (budgets || []).reduce((sum, b) => sum + (b.monthly_amount || 0), 0);
    const spentThisMonth = trends?.daily_expenses * 30 || 0;
    const netWorth = (trends?.assets_eod || 0) - (trends?.liabilities_eod || 0);
    const monthlyIncome = (trends?.daily_income || 0) * 30;
    const monthlyExpenses = spentThisMonth;
    const monthlyGap = monthlyIncome - monthlyExpenses;
    const velocity = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const runway = trends?.daily_expenses > 0 ? Math.floor(netWorth / trends.daily_expenses) : 999;
    return {
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        monthlyGap,
        runway,
        velocity,
        budgetedTotal,
        spentThisMonth,
    };
};
exports.getFinancialMetrics = getFinancialMetrics;
// Analyze impact of a purchase/decision
const analyzeDecisionImpact = async (userId, description, amount, category) => {
    try {
        const metrics = await (0, exports.getFinancialMetrics)(userId);
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        // Financial impact calculation
        const newMonthlyExpenses = metrics.monthlyExpenses + amount;
        const newMonthlyGap = metrics.monthlyIncome - newMonthlyExpenses;
        const newRunway = metrics.monthlyIncome > 0 ?
            metrics.netWorth / (newMonthlyExpenses / 30) : 999;
        const runwayChange = newRunway - metrics.runway;
        let affordability = 'easily';
        if (newMonthlyGap < 0)
            affordability = 'not possible';
        else if (newMonthlyGap < 500)
            affordability = 'challenging';
        // Get LLM analysis for other life dimensions
        const prompt = `Analyze this life decision: ${description} (Cost: $${amount}, Category: ${category})

Current Financial State:
- Monthly Income: $${metrics.monthlyIncome.toFixed(2)}
- Monthly Expenses: $${metrics.monthlyExpenses.toFixed(2)}
- Monthly Gap: $${metrics.monthlyGap.toFixed(2)}
- Runway: ${metrics.runway} days
- Net Worth: $${metrics.netWorth.toFixed(2)}

After this decision:
- New Monthly Expenses: $${newMonthlyExpenses.toFixed(2)}
- New Monthly Gap: $${newMonthlyGap.toFixed(2)}
- New Runway: ${newRunway.toFixed(0)} days

Provide analysis for:
1. Physical/Health impact (score 0-10)
2. Emotional/Happiness impact (score 0-10)
3. Career impact (score 0-10)
4. Relationship impact (score 0-10)
5. Is it worth it overall? (yes/no + score -10 to 10)
6. Top 3 alternatives to achieve the same benefit

Return as JSON with structure: {physical, emotional, career, relationships, overall}`;
        const insights = await llm.generateInsights(metrics, {}, {});
        // Build impact analysis
        const impact = {
            financial: {
                netWorthChange: -amount,
                runwayChange,
                budgetImpact: amount,
                affordability,
                recommendation: newMonthlyGap < 0
                    ? `Cannot afford this. Need additional $${Math.abs(newMonthlyGap).toFixed(2)}/month`
                    : `Can afford this${affordability === 'challenging' ? ', but reduces monthly cushion' : ''}`,
            },
            physical: {
                impact: 'Awaiting AI analysis',
                benefit: 5,
                reasoning: '',
            },
            emotional: {
                impact: 'Awaiting AI analysis',
                benefit: 5,
                reasoning: '',
            },
            career: {
                impact: 'Awaiting AI analysis',
                benefit: 5,
                reasoning: '',
            },
            relationships: {
                impact: 'Awaiting AI analysis',
                benefit: 5,
                reasoning: '',
            },
            overall: {
                isWorthIt: affordability !== 'not possible',
                score: affordability === 'easily' ? 5 : 2,
                alternatives: [
                    'Reduce spending in another category',
                    'Work additional hours this month',
                    'Postpone decision to next month',
                ],
                recommendation: affordability === 'easily'
                    ? 'Go for it - financially sustainable'
                    : affordability === 'challenging'
                        ? 'Doable but requires trade-offs. Consider alternatives.'
                        : 'Not recommended at this time. Here\'s how to make it work...',
            },
        };
        return impact;
    }
    catch (error) {
        console.error('Error analyzing decision impact:', error);
        throw error;
    }
};
exports.analyzeDecisionImpact = analyzeDecisionImpact;
// Get recommendations to afford a purchase
const getAffordabilityPath = async (userId, amount, description) => {
    try {
        const metrics = await (0, exports.getFinancialMetrics)(userId);
        const shortfall = amount - metrics.monthlyGap;
        if (shortfall <= 0) {
            return ['You can afford this from your current monthly gap'];
        }
        const paths = [
            `Reduce spending: Cut $${shortfall.toFixed(2)} from discretionary categories`,
            `Work extra: ${(shortfall / 50).toFixed(1)} hours at $50/hr covers this`,
            `Side income: Create $${shortfall.toFixed(2)} in side income this month`,
            `Savings: Use ${(shortfall / metrics.netWorth * 100).toFixed(1)}% of savings`,
            `Defer: Postpone ${Math.ceil(shortfall / metrics.monthlyGap)} months to save up`,
            `Borrow: Take a short-term loan and repay over ${Math.ceil(amount / metrics.monthlyGap)} months`,
        ];
        return paths.filter(p => p);
    }
    catch (error) {
        console.error('Error getting affordability path:', error);
        return [];
    }
};
exports.getAffordabilityPath = getAffordabilityPath;
//# sourceMappingURL=impact-engine.js.map