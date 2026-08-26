"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMilestoneInsights = exports.completeMilestone = exports.createMilestone = exports.getMilestones = void 0;
const supabase_js_1 = require("./supabase.js");
const getMilestones = async (userId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .order('target_date', { ascending: true });
    return data || [];
};
exports.getMilestones = getMilestones;
const createMilestone = async (userId, title, targetDate, category) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('milestones')
        .insert([{ user_id: userId, title, target_date: targetDate, category, status: 'active', created_at: new Date().toISOString() }])
        .select()
        .single();
    return data;
};
exports.createMilestone = createMilestone;
const completeMilestone = async (userId, milestoneId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('milestones')
        .update({ status: 'completed', completed_date: new Date().toISOString() })
        .eq('id', milestoneId)
        .eq('user_id', userId)
        .select()
        .single();
    return data;
};
exports.completeMilestone = completeMilestone;
const getMilestoneInsights = async (userId) => {
    const milestones = await (0, exports.getMilestones)(userId);
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
exports.getMilestoneInsights = getMilestoneInsights;
//# sourceMappingURL=summit.js.map