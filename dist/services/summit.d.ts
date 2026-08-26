export declare const getMilestones: (userId: string) => Promise<any[]>;
export declare const createMilestone: (userId: string, title: string, targetDate: string, category: string) => Promise<any>;
export declare const completeMilestone: (userId: string, milestoneId: string) => Promise<any>;
export declare const getMilestoneInsights: (userId: string) => Promise<{
    category: string;
    insight: string;
    actionItems: string[];
    urgency: string;
    impact: string;
}[]>;
//# sourceMappingURL=summit.d.ts.map