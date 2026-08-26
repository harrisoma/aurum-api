"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationshipInsights = exports.recordInteraction = exports.createConnection = exports.getConnections = void 0;
const supabase_js_1 = require("./supabase.js");
const getConnections = async (userId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('connections')
        .select('*')
        .eq('user_id', userId)
        .order('last_contact', { ascending: false });
    return data || [];
};
exports.getConnections = getConnections;
const createConnection = async (userId, name, relationship) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('connections')
        .insert([{ user_id: userId, name, relationship, created_at: new Date().toISOString() }])
        .select()
        .single();
    return data;
};
exports.createConnection = createConnection;
const recordInteraction = async (userId, connectionId, note) => {
    const { data } = await supabase_js_1.supabaseAdmin
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
exports.recordInteraction = recordInteraction;
const getRelationshipInsights = async (userId) => {
    const connections = await (0, exports.getConnections)(userId);
    return [
        { category: 'relationships', insight: `You have ${connections.length} meaningful relationships tracked`, actionItems: ['Nurture key relationships'], urgency: 'medium', impact: 'Stronger bonds' }
    ];
};
exports.getRelationshipInsights = getRelationshipInsights;
//# sourceMappingURL=circle.js.map