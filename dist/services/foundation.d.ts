export declare const getHabits: (userId: string) => Promise<any[]>;
export declare const createHabit: (userId: string, habitName: string, frequency: string, category: string) => Promise<any>;
export declare const logHabitCompletion: (userId: string, habitId: string) => Promise<any>;
export declare const getHabitInsights: (userId: string) => Promise<{
    category: string;
    insight: string;
    actionItems: string[];
    urgency: string;
    impact: string;
}[]>;
//# sourceMappingURL=foundation.d.ts.map