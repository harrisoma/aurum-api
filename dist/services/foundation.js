"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitInsights = exports.logHabitCompletion = exports.createHabit = exports.getHabits = void 0;
const supabase_js_1 = require("./supabase.js");
const getHabits = async (userId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data || [];
};
exports.getHabits = getHabits;
const createHabit = async (userId, habitName, frequency, category) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('habits')
        .insert([{ user_id: userId, habit_name: habitName, frequency, category, status: 'active', created_at: new Date().toISOString(), streak: 0 }])
        .select()
        .single();
    return data;
};
exports.createHabit = createHabit;
const logHabitCompletion = async (userId, habitId) => {
    const { data } = await supabase_js_1.supabaseAdmin
        .from('habit_logs')
        .insert([{ user_id: userId, habit_id: habitId, completed_date: new Date().toISOString() }])
        .select()
        .single();
    return data;
};
exports.logHabitCompletion = logHabitCompletion;
const getHabitInsights = async (userId) => {
    const habits = await (0, exports.getHabits)(userId);
    const activeHabits = habits.filter(h => h.status === 'active').length;
    return [{
            category: 'habits',
            insight: `You're tracking ${activeHabits} active habits to build your foundation`,
            actionItems: ['Log daily completions', 'Build your streak'],
            urgency: 'high',
            impact: 'Better daily routine'
        }];
};
exports.getHabitInsights = getHabitInsights;
//# sourceMappingURL=foundation.js.map