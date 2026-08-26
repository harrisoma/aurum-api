import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from './routes/health';
import financialRoutes from './routes/financial';
import authRoutes from './routes/auth';
import vaultRoutes from './routes/vault';
import scenarioRoutes from './routes/scenario';
import initRoutes from './routes/init';
import compassRoutes from './routes/compass';
import vitalityRoutes from './routes/vitality';
import circleRoutes from './routes/circle';
import summitRoutes from './routes/summit';
import foundationRoutes from './routes/foundation';
import echoRoutes from './routes/echo';
import impactRoutes from './routes/impact';
import plaidRoutes from './routes/plaid';
import cryptoRoutes from './routes/crypto';
import vaultxRoutes from './routes/vaultx';

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
app.use('/api/financial', financialRoutes);
app.use('/api/aurum', vaultRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/trading', vaultxRoutes);
app.use('/api/compass', compassRoutes);
app.use('/api/vitality', vitalityRoutes);
app.use('/api/circle', circleRoutes);
app.use('/api/summit', summitRoutes);
app.use('/api/foundation', foundationRoutes);
app.use('/api/echo', echoRoutes);
app.use('/api/scenario', scenarioRoutes);
app.use('/init', initRoutes);

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
