import { supabaseAdmin } from './supabase.js';

export const getConnections = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('connections')
    .select('*')
    .eq('user_id', userId)
    .order('last_contact', { ascending: false });
  return data || [];
};

export const createConnection = async (userId: string, name: string, relationship: string) => {
  const { data } = await supabaseAdmin
    .from('connections')
    .insert([{ user_id: userId, name, relationship, created_at: new Date().toISOString() }])
    .select()
    .single();
  return data;
};

export const recordInteraction = async (userId: string, connectionId: string, note: string) => {
  const { data } = await supabaseAdmin
    .from('interactions')
    .insert([{
      user_id: userId,
      connection_id: connectionId,
      note,
      interaction_date: new Date().toISOString(),
    }])
    .select()
    .single();
  return data;
};

export const getRelationshipInsights = async (userId: string) => {
  const connections = await getConnections(userId);
  return [
    { category: 'relationships', insight: `You have ${connections.length} meaningful relationships tracked`, actionItems: ['Nurture key relationships'], urgency: 'medium', impact: 'Stronger bonds' }
  ];
};
