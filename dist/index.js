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
const auth_1 = __importDefault(require("./routes/auth"));
const plaid_1 = __importDefault(require("./routes/plaid"));
const assets_1 = __importDefault(require("./routes/assets"));
const income_1 = __importDefault(require("./routes/income"));
const credit_1 = __importDefault(require("./routes/credit"));
const budget_1 = __importDefault(require("./routes/budget"));
const invest_1 = __importDefault(require("./routes/invest"));
const decision_layer_1 = __importDefault(require("./routes/decision-layer"));
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
app.use('/api/plaid', plaid_1.default);
app.use('/api/assets', assets_1.default);
app.use('/api/income', income_1.default);
app.use('/api/credit', credit_1.default);
app.use('/api/budget', budget_1.default);
app.use('/api/invest', invest_1.default);
app.use('/api/decision', decision_layer_1.default);
// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AURUM API',
        version: '1.0.0',
        status: 'running',
        description: 'AURUM - Wealth Management Platform',
        pillars: {
            assets: {
                description: 'Home, Car, Life Insurance',
                endpoints: {
                    list: 'GET /api/assets',
                    create: 'POST /api/assets',
                    update: 'PUT /api/assets/:id',
                    delete: 'DELETE /api/assets/:id',
                },
            },
            income: {
                description: 'Job, Business, Side Gigs, Child Support, Investments',
                endpoints: {
                    list: 'GET /api/income',
                    create: 'POST /api/income',
                    update: 'PUT /api/income/:id',
                    delete: 'DELETE /api/income/:id',
                },
            },
            credit: {
                description: 'Credit Reports, Score Tracking, Dispute Management',
                endpoints: {
                    upload: 'POST /api/credit/upload',
                    status: 'GET /api/credit/status',
                    disputes: 'GET /api/credit/disputes',
                    guidance: 'GET /api/credit/guidance',
                },
            },
            budget: {
                description: 'Income vs Liabilities vs Expenses Allocation',
                endpoints: {
                    current: 'GET /api/budget',
                    allocate: 'POST /api/budget/allocate',
                    forecast: 'GET /api/budget/forecast',
                },
            },
            invest: {
                description: 'Long-term & Short-term Investments, Turtlebot Fallback',
                endpoints: {
                    portfolio: 'GET /api/invest/portfolio',
                    trade: 'POST /api/invest/trade',
                    performance: 'GET /api/invest/performance',
                },
            },
            decision: {
                description: 'AI-powered financial health guidance and recommendations',
                endpoints: {
                    analyze: 'POST /api/decision/analyze',
                    snapshot: 'GET /api/decision/snapshot',
                    guidance: 'GET /api/decision/guidance',
                },
            },
        },
        integrations: {
            plaid: 'Banking & Account Aggregation',
            openTax: 'Tax Calculations (IRS-validated)',
            metro2: 'Credit Report Parsing',
            walletConnect: 'Cryptocurrency & DeFi',
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