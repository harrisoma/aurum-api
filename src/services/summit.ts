import { supabaseAdmin } from './supabase.js';

export const getMilestones = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .eq('user_id', userId)
    .order('target_date', { ascending: true });
  return data || [];
};

export const createMilestone = async (userId: string, title: string, targetDate: string, category: string) => {
  const { data } = await supabaseAdmin
    .from('milestones')
    .insert([{ user_id: userId, title, target_date: targetDate, category, status: 'active', created_at: new Date().toISOString() }])
    .select()
    .single();
  return data;
};

export const completeMilestone = async (userId: string, milestoneId: string) => {
  const { data } = await supabaseAdmin
    .from('milestones')
    .update({ status: 'completed', completed_date: new Date().toISOString() })
    .eq('id', milestoneId)
    .eq('user_id', userId)
    .select()
    .single();
  return data;
};

export const getMilestoneInsights = async (userId: string) => {
  const milestones = await getMilestones(userId);
  const completed = milestones.filter(m => m.status === 'completed').length;
  const upcoming = milestones.filter(m => m.status === 'active').length;

  return [{
    category: 'achievements',
    insight: `You've completed ${completed} milestones with ${upcoming} upcoming`,
    actionItems: ['Review progress on key goals'],
    urgency: 'medium',
    impact: 'Life clarity'
  }];
};
