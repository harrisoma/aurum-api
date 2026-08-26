"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSkillEndorsement = exports.getCareerRecommendations = exports.generateCareerInsights = exports.createCareerGoal = exports.getUserSkills = exports.getCareerGoals = void 0;
const supabase_js_1 = require("./supabase.js");
const llm_adapter_js_1 = require("./llm-adapter.js");
// Get all career goals for user
const getCareerGoals = async (userId) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('career_goals')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false });
    if (error) {
        console.error('Error fetching career goals:', error);
        return [];
    }
    return data || [];
};
exports.getCareerGoals = getCareerGoals;
// Get skills for user
const getUserSkills = async (userId) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('skills')
        .select('*')
        .eq('user_id', userId)
        .order('proficiency_level', { ascending: false });
    if (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
    return data || [];
};
exports.getUserSkills = getUserSkills;
// Create career goal
const createCareerGoal = async (userId, title, description, targetDate, priority) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('career_goals')
        .insert([
        {
            user_id: userId,
            title,
            description,
            target_date: targetDate,
            priority,
            status: 'active',
        },
    ])
        .select()
        .single();
    if (error) {
        console.error('Error creating career goal:', error);
        return null;
    }
    return data;
};
exports.createCareerGoal = createCareerGoal;
// Generate career insights using LLM
const generateCareerInsights = async (userId) => {
    try {
        const goals = await (0, exports.getCareerGoals)(userId);
        const skills = await (0, exports.getUserSkills)(userId);
        const prompt = `You are a career advisor. Analyze this professional profile and provide 3-5 actionable career insights.

CAREER GOALS:
${goals.map(g => `- ${g.title} (${g.priority} priority, target: ${g.target_date})`).join('\n')}

CURRENT SKILLS:
${skills.map(s => `- ${s.skill_name}: Level ${s.proficiency_level}/10 (${s.years_experience} years)`).join('\n')}

Provide insights in JSON format with: category, insight, actionItems[], urgency, impact`;
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        const insights = await llm.generateInsights({ goals: goals.length, skills: skills.length }, { totalSkills: skills.length }, {});
        return insights;
    }
    catch (error) {
        console.error('Error generating insights:', error);
        return [
            {
                category: 'setup',
                insight: 'Set career goals to get personalized career guidance',
                actionItems: ['Define your 3-5 year career vision', 'Assess your current skills'],
                urgency: 'medium',
                impact: 'Clarity on career direction',
            },
        ];
    }
};
exports.generateCareerInsights = generateCareerInsights;
// Get career recommendations
const getCareerRecommendations = async (userId) => {
    try {
        const goals = await (0, exports.getCareerGoals)(userId);
        const skills = await (0, exports.getUserSkills)(userId);
        if (goals.length === 0) {
            return [
                'Define your career goals and vision',
                'Assess and document your current skills',
                'Identify skill gaps for your target role',
            ];
        }
        const topGoal = goals[0];
        const topSkill = skills[0];
        const prompt = `Based on this career profile, suggest 3 specific actions for this month:
Goal: ${topGoal.title}
Top Skill: ${topSkill.skill_name} (Level ${topSkill.proficiency_level}/10)

Return only JSON array: ["action1", "action2", "action3"]`;
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        return await llm.generateRecommendations({ goals: goals.length }, skills.slice(0, 3).map(s => s.skill_name));
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
        return [
            'Work on your top 3 skills this month',
            'Network with professionals in your target industry',
            'Take a course or certification for career growth',
        ];
    }
};
exports.getCareerRecommendations = getCareerRecommendations;
// Track skill progress
const addSkillEndorsement = async (userId, skillId, endorsements) => {
    const { data, error } = await supabase_js_1.supabaseAdmin
        .from('skills')
        .update({ endorsements: endorsements + 1, last_updated: new Date().toISOString() })
        .eq('id', skillId)
        .eq('user_id', userId)
        .select()
        .single();
    if (error) {
        console.error('Error updating skill:', error);
        return null;
    }
    return data;
};
exports.addSkillEndorsement = addSkillEndorsement;
//# sourceMappingURL=compass.js.map