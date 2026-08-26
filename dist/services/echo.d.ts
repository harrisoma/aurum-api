export declare const getLegacyItems: (userId: string) => Promise<any[]>;
export declare const createLegacyItem: (userId: string, title: string, description: string, category: string) => Promise<any>;
export declare const getMemories: (userId: string) => Promise<any[]>;
export declare const recordMemory: (userId: string, title: string, content: string, memoryDate: string) => Promise<any>;
export declare const getLegacyInsights: (userId: string) => Promise<{
    category: string;
    insight: string;
    actionItems: string[];
    urgency: string;
    impact: string;
}[]>;
//# sourceMappingURL=echo.d.ts.map