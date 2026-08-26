"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBudgetRecommendations = generateBudgetRecommendations;
exports.getBudgetStatus = getBudgetStatus;
exports.forecastBudgets = forecastBudgets;
exports.checkBudgetAlerts = checkBudgetAlerts;
exports.createBudget = createBudget;
const supabase_1 = require("./supabase");
// Generate smart budget recommendations based on spending history
async function generateBudgetRecommendations(userId) {
    try {
        // Get last 3 months of category spending
        const { data: categoryData, error } = await supabase_1.supabaseAdmin
            .from('category_trends')
            .select('category, total_spent, transaction_count')
            .eq('user_id', userId)
            .order('month', { ascending: false })
            .limit(300); // ~3 months x ~100 categories
        if (error)
            throw error;
        // Calculate recommendations by category
        const categoryStats = {};
        categoryData?.forEach((row) => {
            if (!categoryStats[row.category]) {
                categoryStats[row.category] = {
                    amounts: [],
                    count: 0,
                };
            }
            categoryStats[row.category].amounts.push(row.total_spent);
            categoryStats[row.category].count += row.transaction_count;
        });
        const recommendations = [];
        for (const [category, stats] of Object.entries(categoryStats)) {
            const amounts = stats.amounts;
            if (amounts.length === 0)
                continue;
            // Calculate statistics
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            // Recommendation = average + 1 std dev (buffer for variability)
            const recommended = avg + stdDev;
            // Determine confidence based on data points
            const confidence = Math.min(0.95, 0.5 + (stats.count / 100) * 0.45);
            // Generate reasoning
            let reasoning = `Based on ${stats.count} transactions over 3 months. `;
            if (stdDev > avg * 0.3) {
                reasoning += 'High variability detected - recommend flexible budget.';
            }
            else {
                reasoning += 'Consistent spending pattern.';
            }
            recommendations.push({
                category,
                recommendedAmount: Math.round(recommended * 100) / 100,
                historicalAvg: Math.round(avg * 100) / 100,
                historicalStdDev: Math.round(stdDev * 100) / 100,
                reasoning,
                confidenceScore: Math.round(confidence * 100) / 100,
            });
        }
        // Sort by confidence and save to database
        recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
        // Save recommendations
        for (const rec of recommendations) {
            await supabase_1.supabaseAdmin
                .from('budget_recommendations')
                .upsert({
                user_id: userId,
                category: rec.category,
                recommended_amount: rec.recommendedAmount,
                historical_avg: rec.historicalAvg,
                historical_std_dev: rec.historicalStdDev,
                reasoning: rec.reasoning,
                confidence_score: rec.confidenceScore,
                generated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }, { onConflict: 'user_id,category,DATE(generated_at)' });
        }
        return recommendations;
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
        throw error;
    }
}
// Get current budget status for all user budgets
async function getBudgetStatus(userId) {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('budget_status_view')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        return (data || []).map((row) => ({
            category: row.category,
            budgeted: row.budgeted,
            spentThisMonth: row.spent_this_month,
            remaining: row.remaining,
            percentUsed: row.percent_used,
            status: row.percent_used > 100 ? 'critical' :
                row.percent_used > 80 ? 'warning' :
                    'healthy',
        }));
    }
    catch (error) {
        console.error('Error getting budget status:', error);
        throw error;
    }
}
// Forecast spending through month-end
async function forecastBudgets(userId) {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();
        const dayOfMonth = now.getDate();
        const daysRemaining = daysInMonth - dayOfMonth;
        // Get current spending by category this month
        const { data: spending, error: spendingError } = await supabase_1.supabaseAdmin
            .from('transactions')
            .select('category, amount')
            .eq('user_id', userId)
            .gte('transaction_date', monthStart.toISOString())
            .lte('transaction_date', now.toISOString())
            .lt('amount', 0); // Only expenses
        if (spendingError)
            throw spendingError;
        // Get user budgets
        const { data: budgets, error: budgetError } = await supabase_1.supabaseAdmin
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
        if (budgetError)
            throw budgetError;
        const categorySpending = {};
        spending?.forEach((row) => {
            const cat = row.category || 'Uncategorized';
            categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(row.amount);
        });
        const forecasts = [];
        for (const budget of budgets || []) {
            const spentToDate = categorySpending[budget.category] || 0;
            const dailyBurnRate = spentToDate / dayOfMonth;
            const projectedMonthEnd = spentToDate + (dailyBurnRate * daysRemaining);
            forecasts.push({
                category: budget.category,
                budgeted: budget.monthly_amount,
                projectedMonthEnd: Math.round(projectedMonthEnd * 100) / 100,
                variance: Math.round((projectedMonthEnd - budget.monthly_amount) * 100) / 100,
                percentageOverUnder: Math.round((((projectedMonthEnd - budget.monthly_amount) / budget.monthly_amount) * 100) * 100) / 100,
                daysRemaining,
                dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
            });
        }
        // Save snapshots
        for (const forecast of forecasts) {
            await supabase_1.supabaseAdmin
                .from('budget_snapshots')
                .insert({
                user_id: userId,
                budget_id: budgets?.find((b) => b.category === forecast.category)?.id,
                snapshot_date: now.toISOString().split('T')[0],
                budgeted_amount: forecast.budgeted,
                spent_to_date: categorySpending[forecast.category] || 0,
                remaining_amount: forecast.budgeted - (categorySpending[forecast.category] || 0),
                variance_percent: forecast.percentageOverUnder,
                projected_month_end: forecast.projectedMonthEnd,
            });
        }
        return forecasts;
    }
    catch (error) {
        console.error('Error forecasting budgets:', error);
        throw error;
    }
}
// Create budget alerts based on rules
async function checkBudgetAlerts(userId) {
    try {
        const status = await getBudgetStatus(userId);
        const alerts = [];
        for (const budget of status) {
            // Check if over budget
            if (budget.percentUsed > 100) {
                alerts.push({
                    budgetCategory: budget.category,
                    type: 'critical',
                    message: `Over budget! Spent $${budget.spentThisMonth.toFixed(2)} of $${budget.budgeted.toFixed(2)}`,
                    severity: 'critical',
                });
            }
            // Check if approaching budget
            else if (budget.percentUsed > 80) {
                alerts.push({
                    budgetCategory: budget.category,
                    type: 'warning',
                    message: `Approaching budget: ${budget.percentUsed.toFixed(1)}% used`,
                    severity: 'high',
                });
            }
        }
        // Save alerts to database
        for (const alert of alerts) {
            // Find budget ID
            const { data: budgetData } = await supabase_1.supabaseAdmin
                .from('budgets')
                .select('id')
                .eq('user_id', userId)
                .eq('category', alert.budgetCategory)
                .single();
            if (budgetData) {
                await supabase_1.supabaseAdmin
                    .from('budget_alerts')
                    .insert({
                    user_id: userId,
                    budget_id: budgetData.id,
                    alert_type: alert.type,
                    message: alert.message,
                    severity: alert.severity,
                });
            }
        }
        return alerts;
    }
    catch (error) {
        console.error('Error checking budget alerts:', error);
        throw error;
    }
}
// Create a new budget
async function createBudget(userId, category, monthlyAmount, rules) {
    try {
        const { data: budget, error: budgetError } = await supabase_1.supabaseAdmin
            .from('budgets')
            .insert({
            user_id: userId,
            category,
            monthly_amount: monthlyAmount,
            period_type: 'monthly',
            is_active: true,
        })
            .select()
            .single();
        if (budgetError)
            throw budgetError;
        // Create rules if provided
        if (rules && budget) {
            for (const rule of rules) {
                await supabase_1.supabaseAdmin
                    .from('budget_rules')
                    .insert({
                    user_id: userId,
                    budget_id: budget.id,
                    rule_type: rule.type,
                    threshold_percent: rule.threshold,
                    action: rule.action,
                });
            }
        }
        return budget;
    }
    catch (error) {
        console.error('Error creating budget:', error);
        throw error;
    }
}
//# sourceMappingURL=vault.js.map