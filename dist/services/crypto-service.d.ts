export interface CryptoWallet {
    address: string;
    blockchain: string;
    symbol: string;
    balance: number;
    valueUSD: number;
    lastUpdated: string;
}
export interface CryptoTransaction {
    hash: string;
    from: string;
    to: string;
    value: number;
    symbol: string;
    date: string;
    type: 'send' | 'receive';
}
export declare const getEthereumBalance: (address: string) => Promise<CryptoWallet | null>;
export declare const getCryptoPrice: (coinId: string) => Promise<number>;
export declare const getEthereumTransactions: (address: string, startBlock?: number) => Promise<CryptoTransaction[]>;
export declare const getKrakenBalance: (apiKey: string, privateKey: string) => Promise<CryptoWallet[]>;
export declare const saveWallet: (userId: string, address: string, blockchain: string, data: CryptoWallet) => Promise<void>;
export declare const getUserCryptoNetWorth: (userId: string) => Promise<number>;
//# sourceMappingURL=crypto-service.d.ts.map