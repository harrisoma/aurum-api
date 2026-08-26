"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const financial_1 = __importDefault(require("./routes/financial"));
const auth_1 = __importDefault(require("./routes/auth"));
const vault_1 = __importDefault(require("./routes/vault"));
const scenario_1 = __importDefault(require("./routes/scenario"));
const init_1 = __importDefault(require("./routes/init"));
const compass_1 = __importDefault(require("./routes/compass"));
const vitality_1 = __importDefault(require("./routes/vitality"));
const circle_1 = __importDefault(require("./routes/circle"));
const summit_1 = __importDefault(require("./routes/summit"));
const foundation_1 = __importDefault(require("./routes/foundation"));
const echo_1 = __importDefault(require("./routes/echo"));
const impact_1 = __importDefault(require("./routes/impact"));
const plaid_1 = __importDefault(require("./routes/plaid"));
const crypto_1 = __importDefault(require("./routes/crypto"));
const vaultx_1 = __importDefault(require("./routes/vaultx"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Routes
app.use('/health', health_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/financial', financial_1.default);
app.use('/api/aurum', vault_1.default);
app.use('/api/impact', impact_1.default);
app.use('/api/plaid', plaid_1.default);
app.use('/api/crypto', crypto_1.default);
app.use('/api/trading', vaultx_1.default);
app.use('/api/compass', compass_1.default);
app.use('/api/vitality', vitality_1.default);
app.use('/api/circle', circle_1.default);
app.use('/api/summit', summit_1.default);
app.use('/api/foundation', foundation_1.default);
app.use('/api/echo', echo_1.default);
app.use('/api/scenario', scenario_1.default);
app.use('/init', init_1.default);
// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AURUM API',
        version: '1.0.0',
        status: 'running',
        description: 'AURUM - Premium Wealth OS. Holistic Life Operating System - Financial + Career + Health + Relationships + Goals + Habits + Legacy',
        vault: {
            description: 'Financial Intelligence - Real-time decision impact analysis',
            endpoints: {
                status: '/api/vault/status',
                forecast: '/api/vault/forecast',
                alerts: '/api/vault/alerts',
                budget: '/api/vault/budget',
                insights: '/api/vault/insights',
                recommendations: '/api/vault/recommendations-monthly',
                dashboard: '/api/vault/dashboard',
            },
        },
        impact: {
            description: 'Impact Analysis Engine - Holistic life decision analysis',
            endpoints: {
                metrics: '/api/impact/metrics',
                analyze: '/api/impact/analyze (POST)',
                affordability: '/api/impact/affordability (POST)',
                dashboard: '/api/impact/dashboard',
            },
        },
        plaid: {
            description: 'Bank Account Integration - Connect to 12,000+ financial institutions',
            endpoints: {
                linkToken: '/api/plaid/link-token',
                exchangeToken: '/api/plaid/exchange-token (POST)',
                accounts: '/api/plaid/accounts',
                transactions: '/api/plaid/transactions',
                sync: '/api/plaid/sync (POST)',
            },
        },
        features: {
            'Real-time transactions': 'Plaid + Crypto + Stocks integration',
            'Financial aggregation': 'Banks, credit cards, investments, crypto, tax',
            'Impact analysis': 'Financial + Physical + Emotional + Career analysis',
            'Decision support': 'How will this purchase affect my life?',
            'Smart recommendations': 'How to afford something without breaking budget',
            'Multi-provider LLM': 'DeepSeek, Claude, OpenRouter, Onyx support',
            'Holistic insights': 'Context across all 7 life dimensions',
        },
        apps: {
            vault: '/api/vault - Financial Intelligence',
            compass: '/api/compass - Career Alignment',
            vitality: '/api/vitality - Health Tracking',
            circle: '/api/circle - Relationships',
            summit: '/api/summit - Life Goals',
            foundation: '/api/foundation - Habits',
            echo: '/api/echo - Legacy',
        },
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Life Map API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💰 Financial endpoints: http://localhost:${PORT}/api/financial`);
});
exports.default = app;
//# sourceMappingURL=index.js.map