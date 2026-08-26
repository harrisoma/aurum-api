"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegacyInsights = exports.recordMemory = exports.getMemories = exports.createLegacyItem = exports.getLegacyItems = void 0;
const supabase_js_1 = require("./supabase.js");
const getLegacyItems = async (userId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('legacy_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data || [];
};
exports.getLegacyItems = getLegacyItems;
const createLegacyItem = async (userId, title, description, category) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('legacy_items')
        .insert([{ user_id: userId, title, description, category, created_at: new Date().toISOString() }])
        .select()
        .single();
    return data;
};
exports.createLegacyItem = createLegacyItem;
const getMemories = async (userId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('memory_date', { ascending: false });
    return data || [];
};
exports.getMemories = getMemories;
const recordMemory = async (userId, title, content, memoryDate) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('memories')
        .insert([{ user_id: userId, title, content, memory_date: memoryDate, created_at: new Date().toISOString() }])
        .select()
        .single();
    return data;
};
exports.recordMemory = recordMemory;
const getLegacyInsights = async (userId) => {
    const items = await (0, exports.getLegacyItems)(userId);
    const memories = await (0, exports.getMemories)(userId);
    return [{
            category: 'legacy',
            insight: `You have ${items.length} legacy items and ${memories.length} memories documented`,
            actionItems: ['Share your story', 'Document key moments'],
            urgency: 'medium',
            impact: 'Living history preserved'
        }];
};
exports.getLegacyInsights = getLegacyInsights;
//# sourceMappingURL=echo.js.map