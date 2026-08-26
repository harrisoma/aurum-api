export declare const getConnections: (userId: string) => Promise<any[]>;
export declare const createConnection: (userId: string, name: string, relationship: string) => Promise<any>;
export declare const recordInteraction: (userId: string, connectionId: string, note: string) => Promise<any>;
export declare const getRelationshipInsights: (userId: string) => Promise<{
    category: string;
    insight: string;
    actionItems: string[];
    urgency: string;
    impact: string;
}[]>;
//# sourceMappingURL=circle.d.ts.map