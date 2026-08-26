import { supabaseAdmin } from './supabase.js';
import { getLLMAdapter } from './llm-adapter.js';

export const getHealthMetrics = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('health_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_date', { ascending: false })
    .limit(30);

  return data || [];
};

export const getWorkouts = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false });

  return data || [];
};

export const createHealthEntry = async (
  userId: string,
  metricType: string,
  value: number,
  unit: string
) => {
  const { data, error } = await supabaseAdmin
    .from('health_metrics')
    .insert([{
      user_id: userId,
      metric_type: metricType,
      value,
      unit,
      recorded_date: new Date().toISOString(),
    }])
    .select()
    .single();

  return data;
};

export const generateHealthInsights = async (userId: string) => {
  try {
    const metrics = await getHealthMetrics(userId);
    const workouts = await getWorkouts(userId);

    const llm = getLLMAdapter();
    return await llm.generateInsights(
      { metricsCount: metrics.length, workoutsCount: workouts.length },
      { recentMetrics: metrics.slice(0, 5) },
      {}
    );
  } catch (error) {
    console.error('Error generating health insights:', error);
    return [];
  }
};

export const getHealthRecommendations = async (userId: string) => {
  try {
    const metrics = await getHealthMetrics(userId);
    const llm = getLLMAdapter();

    return await llm.generateRecommendations(
      { metricsCount: metrics.length },
      ['Exercise', 'Nutrition', 'Sleep']
    );
  } catch (error) {
    return [
      'Track your daily metrics consistently',
      'Aim for 150 minutes of weekly exercise',
      'Ensure 7-9 hours of quality sleep',
    ];
  }
};
