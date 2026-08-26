export declare const getHealthMetrics: (userId: string) => Promise<any[]>;
export declare const getWorkouts: (userId: string) => Promise<any[]>;
export declare const createHealthEntry: (userId: string, metricType: string, value: number, unit: string) => Promise<any>;
export declare const generateHealthInsights: (userId: string) => Promise<any[]>;
export declare const getHealthRecommendations: (userId: string) => Promise<string[]>;
//# sourceMappingURL=vitality.d.ts.map