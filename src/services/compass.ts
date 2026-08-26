import { supabaseAdmin } from './supabase.js';
import { getLLMAdapter } from './llm-adapter.js';

export interface CareerGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

export interface SkillAssessment {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number;
  years_experience: number;
  endorsements: number;
  last_updated: string;
}

export interface CareerInsight {
  category: string;
  insight: string;
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high';
  impact: string;
}

// Get all career goals for user
export const getCareerGoals = async (userId: string): Promise<CareerGoal[]> => {
  const { data, error } = await supabaseAdmin
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

// Get skills for user
export const getUserSkills = async (userId: string): Promise<SkillAssessment[]> => {
  const { data, error } = await supabaseAdmin
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

// Create career goal
export const createCareerGoal = async (
  userId: string,
  title: string,
  description: string,
  targetDate: string,
  priority: 'high' | 'medium' | 'low'
): Promise<CareerGoal | null> => {
  const { data, error } = await supabaseAdmin
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

// Generate career insights using LLM
export const generateCareerInsights = async (
  userId: string
): Promise<CareerInsight[]> => {
  try {
    const goals = await getCareerGoals(userId);
    const skills = await getUserSkills(userId);

    const prompt = `You are a career advisor. Analyze this professional profile and provide 3-5 actionable career insights.

CAREER GOALS:
${goals.map(g => `- ${g.title} (${g.priority} priority, target: ${g.target_date})`).join('\n')}

CURRENT SKILLS:
${skills.map(s => `- ${s.skill_name}: Level ${s.proficiency_level}/10 (${s.years_experience} years)`).join('\n')}

Provide insights in JSON format with: category, insight, actionItems[], urgency, impact`;

    const llm = getLLMAdapter();
    const insights = await llm.generateInsights(
      { goals: goals.length, skills: skills.length },
      { totalSkills: skills.length },
      {}
    );

    return insights as CareerInsight[];
  } catch (error) {
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

// Get career recommendations
export const getCareerRecommendations = async (userId: string): Promise<string[]> => {
  try {
    const goals = await getCareerGoals(userId);
    const skills = await getUserSkills(userId);

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

    const llm = getLLMAdapter();
    return await llm.generateRecommendations(
      { goals: goals.length },
      skills.slice(0, 3).map(s => s.skill_name)
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      'Work on your top 3 skills this month',
      'Network with professionals in your target industry',
      'Take a course or certification for career growth',
    ];
  }
};

// Track skill progress
export const addSkillEndorsement = async (
  userId: string,
  skillId: string,
  endorsements: number
): Promise<SkillAssessment | null> => {
  const { data, error } = await supabaseAdmin
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
