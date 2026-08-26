import { PlaidApi } from 'plaid';
export declare const plaidClient: PlaidApi;
export interface PlaidAccount {
    accountId: string;
    name: string;
    type: string;
    subtype: string;
    mask: string;
    currentBalance: number;
}
export interface PlaidTransaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    category: string[];
    merchant: string | null;
}
export declare const getLinkToken: (userId: string) => Promise<string>;
export declare const exchangePublicToken: (userId: string, publicToken: string) => Promise<string>;
export declare const getAccounts: (userId: string) => Promise<PlaidAccount[]>;
export declare const getTransactions: (userId: string, startDate: string, endDate: string) => Promise<PlaidTransaction[]>;
export declare const syncPlaidData: (userId: string) => Promise<void>;
//# sourceMappingURL=plaid-service.d.ts.map