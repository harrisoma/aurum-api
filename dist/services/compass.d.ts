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
export declare const getCareerGoals: (userId: string) => Promise<CareerGoal[]>;
export declare const getUserSkills: (userId: string) => Promise<SkillAssessment[]>;
export declare const createCareerGoal: (userId: string, title: string, description: string, targetDate: string, priority: "high" | "medium" | "low") => Promise<CareerGoal | null>;
export declare const generateCareerInsights: (userId: string) => Promise<CareerInsight[]>;
export declare const getCareerRecommendations: (userId: string) => Promise<string[]>;
export declare const addSkillEndorsement: (userId: string, skillId: string, endorsements: number) => Promise<SkillAssessment | null>;
//# sourceMappingURL=compass.d.ts.map