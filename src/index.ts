import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import plaidRoutes from './routes/plaid';
import assetsRoutes from './routes/assets';
import incomeRoutes from './routes/income';
import creditRoutes from './routes/credit';
import budgetRoutes from './routes/budget';
import investRoutes from './routes/invest';
import decisionLayerRoutes from './routes/decision-layer';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/invest', investRoutes);
app.use('/api/decision', decisionLayerRoutes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;
