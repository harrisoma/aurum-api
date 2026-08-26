import { supabaseAdmin } from './supabase';

interface ScenarioInput {
  name: string;
  type: 'purchase' | 'income_change' | 'goal_change' | 'spending_reduction';
  amount: number;
  category?: string;
  timeframe?: string; // 'immediate', 'this_month', 'this_year'
}

interface ImpactAnalysis {
  netWorthImpact: number;
  runwayImpact: number; // days
  velocityImpact: number; // percentage points
  budgetImpact: number; // how much over/under
  goalProgressImpact: number;
  recommendation: 'proceed' | 'caution' | 'reconsider';
  reasoning: string;
}

/**
 * Analyze how a decision affects all 7 life dimensions
 */
export async function analyzeScenario(
  userId: string,
  scenario: ScenarioInput
): Promise<ImpactAnalysis> {
  try {
    // Get current financial state
    const { data: snapshot, error: snapshotError } = await supabaseAdmin
      .from('user_financial_trends')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError) throw snapshotError;

    const currentNetWorth = snapshot.assets_eod - snapshot.liabilities_eod;
    const monthlyExpenses = snapshot.daily_expenses * 30;
    const monthlyIncome = snapshot.daily_income * 30;
    const runwayDays = currentNetWorth / (monthlyExpenses || 1);
    const velocity = (monthlyExpenses / monthlyIncome) * 100;

    // Calculate impacts based on scenario type
    let netWorthImpact = 0;
    let runwayImpact = 0;
    let velocityImpact = 0;
    let budgetImpact = 0;

    switch (scenario.type) {
      case 'purchase':
        // Buying something reduces net worth and runway
        netWorthImpact = -scenario.amount;
        runwayImpact = -(scenario.amount / (monthlyExpenses || 1)) * 30;

        // Check if it affects budget
        if (scenario.category) {
          const { data: budget } = await supabaseAdmin
            .from('budgets')
            .select('monthly_amount')
            .eq('user_id', userId)
            .eq('category', scenario.category)
            .eq('is_active', true)
            .single();

          if (budget) {
            budgetImpact = scenario.amount;
          }
        }
        break;

      case 'income_change':
        // Income increase improves runway and net worth
        netWorthImpact = scenario.amount * (scenario.timeframe === 'immediate' ? 1 : 12);
        runwayImpact = (scenario.amount / (monthlyExpenses || 1)) * 30;
        velocityImpact = -(scenario.amount / monthlyIncome) * 100;
        break;

      case 'spending_reduction':
        // Reducing spending improves runway and velocity
        const monthlyReduction = scenario.amount;
        runwayImpact = (monthlyReduction / (monthlyExpenses || 1)) * 30;
        velocityImpact = -(monthlyReduction / monthlyIncome) * 100;
        break;

      case 'goal_change':
        // Goal changes affect runway and net worth target
        netWorthImpact = scenario.amount;
        break;
    }

    // Determine recommendation
    let recommendation: 'proceed' | 'caution' | 'reconsider' = 'proceed';
    let reasoning = '';

    if (scenario.type === 'purchase') {
      const newRunway = runwayDays + runwayImpact;
      const newVelocity = velocity + velocityImpact;

      if (newRunway < 30) {
        recommendation = 'reconsider';
        reasoning = `⚠️ Purchase would reduce runway to ${newRunway.toFixed(0)} days (critical threshold: 30 days)`;
      } else if (newRunway < 60) {
        recommendation = 'caution';
        reasoning = `⚠️ Purchase would reduce runway to ${newRunway.toFixed(0)} days (warning threshold: 60 days)`;
      } else if (newVelocity > 110) {
        recommendation = 'caution';
        reasoning = `Spending would exceed 110% of income (unsustainable long-term)`;
      } else {
        reasoning = `✓ Purchase is sustainable. Runway remains healthy at ${newRunway.toFixed(0)} days`;
      }
    } else if (scenario.type === 'income_change' && scenario.amount > 0) {
      reasoning = `✓ Income increase improves financial position. New runway: ${(runwayDays + runwayImpact).toFixed(0)} days`;
    } else if (scenario.type === 'spending_reduction') {
      reasoning = `✓ Reducing spending by $${scenario.amount}/month improves sustainability`;
    }

    return {
      netWorthImpact,
      runwayImpact,
      velocityImpact,
      budgetImpact,
      goalProgressImpact: 0, // Would integrate with goals
      recommendation,
      reasoning,
    };
  } catch (error) {
    console.error('Error analyzing scenario:', error);
    throw error;
  }
}

/**
 * Save scenario analysis for later reference
 */
export async function saveScenario(
  userId: string,
  scenario: ScenarioInput,
  analysis: ImpactAnalysis
) {
  try {
    const { data: scenarioRecord, error: scenarioError } = await supabaseAdmin
      .from('scenarios')
      .insert({
        user_id: userId,
        name: scenario.name,
        scenario_type: scenario.type,
        parameters: {
          amount: scenario.amount,
          category: scenario.category,
          timeframe: scenario.timeframe,
        },
      })
      .select()
      .single();

    if (scenarioError) throw scenarioError;

    // Save impact analysis
    await supabaseAdmin
      .from('scenario_results')
      .insert({
        user_id: userId,
        scenario_id: scenarioRecord.id,
        wealth_impact: {
          netWorthChange: analysis.netWorthImpact,
          runwayDaysChange: analysis.runwayImpact,
          velocityChange: analysis.velocityImpact,
        },
        recommendation: analysis.recommendation,
      });

    return scenarioRecord;
  } catch (error) {
    console.error('Error saving scenario:', error);
    throw error;
  }
}

/**
 * Get impact across all 7 life dimensions (extensible for other modules)
 */
export async function getHolisticImpact(
  userId: string,
  scenario: ScenarioInput
) {
  const financialAnalysis = await analyzeScenario(userId, scenario);

  // This will be extended by other modules (Vitality, Circle, etc)
  return {
    financial: {
      impact: financialAnalysis,
      status: financialAnalysis.recommendation,
    },
    health: {
      impact: null, // Will be provided by Vitality module
      status: 'pending', // Will integrate with health tracking
    },
    relationships: {
      impact: null, // Will be provided by Circle module
      status: 'pending',
    },
    career: {
      impact: null, // Will be provided by Compass module
      status: 'pending',
    },
    habits: {
      impact: null, // Will be provided by Foundation module
      status: 'pending',
    },
    goals: {
      impact: null, // Will be provided by Summit module
      status: 'pending',
    },
    legacy: {
      impact: null, // Will be provided by Echo module
      status: 'pending',
    },
  };
}
