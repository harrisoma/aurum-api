import { supabaseAdmin } from './supabase.js';

export const getHabits = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
};

export const createHabit = async (userId: string, habitName: string, frequency: string, category: string) => {
  const { data } = await supabaseAdmin
    .from('habits')
    .insert([{ user_id: userId, habit_name: habitName, frequency, category, status: 'active', created_at: new Date().toISOString(), streak: 0 }])
    .select()
    .single();
  return data;
};

export const logHabitCompletion = async (userId: string, habitId: string) => {
  const { data } = await supabaseAdmin
    .from('habit_logs')
    .insert([{ user_id: userId, habit_id: habitId, completed_date: new Date().toISOString() }])
    .select()
    .single();
  return data;
};

export const getHabitInsights = async (userId: string) => {
  const habits = await getHabits(userId);
  const activeHabits = habits.filter(h => h.status === 'active').length;

  return [{
    category: 'habits',
    insight: `You're tracking ${activeHabits} active habits to build your foundation`,
    actionItems: ['Log daily completions', 'Build your streak'],
    urgency: 'high',
    impact: 'Better daily routine'
  }];
};
