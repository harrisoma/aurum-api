import { supabaseAdmin } from './supabase.js';

export const getLegacyItems = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('legacy_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
};

export const createLegacyItem = async (userId: string, title: string, description: string, category: string) => {
  const { data } = await supabaseAdmin
    .from('legacy_items')
    .insert([{ user_id: userId, title, description, category, created_at: new Date().toISOString() }])
    .select()
    .single();
  return data;
};

export const getMemories = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('memory_date', { ascending: false });
  return data || [];
};

export const recordMemory = async (userId: string, title: string, content: string, memoryDate: string) => {
  const { data } = await supabaseAdmin
    .from('memories')
    .insert([{ user_id: userId, title, content, memory_date: memoryDate, created_at: new Date().toISOString() }])
    .select()
    .single();
  return data;
};

export const getLegacyInsights = async (userId: string) => {
  const items = await getLegacyItems(userId);
  const memories = await getMemories(userId);

  return [{
    category: 'legacy',
    insight: `You have ${items.length} legacy items and ${memories.length} memories documented`,
    actionItems: ['Share your story', 'Document key moments'],
    urgency: 'medium',
    impact: 'Living history preserved'
  }];
};
