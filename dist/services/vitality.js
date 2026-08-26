"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthRecommendations = exports.generateHealthInsights = exports.createHealthEntry = exports.getWorkouts = exports.getHealthMetrics = void 0;
const supabase_js_1 = require("./supabase.js");
const llm_adapter_js_1 = require("./llm-adapter.js");
const getHealthMetrics = async (userId) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_date', { ascending: false })
        .limit(30);
    return data || [];
};
exports.getHealthMetrics = getHealthMetrics;
const getWorkouts = async (userId) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false });
    return data || [];
};
exports.getWorkouts = getWorkouts;
const createHealthEntry = async (userId, metricType, value, unit) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
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
exports.createHealthEntry = createHealthEntry;
const generateHealthInsights = async (userId) => {
    try {
        const metrics = await (0, exports.getHealthMetrics)(userId);
        const workouts = await (0, exports.getWorkouts)(userId);
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        return await llm.generateInsights({ metricsCount: metrics.length, workoutsCount: workouts.length }, { recentMetrics: metrics.slice(0, 5) }, {});
    }
    catch (error) {
        console.error('Error generating health insights:', error);
        return [];
    }
};
exports.generateHealthInsights = generateHealthInsights;
const getHealthRecommendations = async (userId) => {
    try {
        const metrics = await (0, exports.getHealthMetrics)(userId);
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        return await llm.generateRecommendations({ metricsCount: metrics.length }, ['Exercise', 'Nutrition', 'Sleep']);
    }
    catch (error) {
        return [
            'Track your daily metrics consistently',
            'Aim for 150 minutes of weekly exercise',
            'Ensure 7-9 hours of quality sleep',
        ];
    }
};
exports.getHealthRecommendations = getHealthRecommendations;
//# sourceMappingURL=vitality.js.map