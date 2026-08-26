# LifeCycle: Complete Build Plan

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LIFECYCLE OS                              │
│           Central Decision Intelligence Engine                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   VAULT      │  │  COMPASS     │  │  VITALITY    │      │
│  │  (Wealth)    │  │  (Career)    │  │  (Health)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   CIRCLE     │  │   SUMMIT     │  │ FOUNDATION   │      │
│  │ (Relations)  │  │ (Milestones) │  │  (Habits)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │            ECHO (Legacy)                         │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Build Sequence

### Phase 1: Vault (Wealth) - ✅ DONE
- [x] Schema design
- [x] Recommendation engine
- [x] Forecasting engine
- [x] Scenario analysis
- [x] API routes
- [ ] **Initialize Supabase schema** ← NEXT

### Phase 2: Core Apps (Independent)

#### Compass (Career)
- Database tables: jobs, income_streams, skills, opportunities
- Services:
  - Income optimization
  - Career path analysis
  - Job satisfaction tracking
  - Skill growth recommendations
- APIs:
  - GET /api/compass/income - Current + potential income
  - GET /api/compass/satisfaction - Job/career satisfaction score
  - POST /api/compass/decision - Analyze career decision impact

#### Vitality (Health)
- Database tables: health_metrics, exercise, nutrition, sleep, stress
- Services:
  - Health score calculation
  - Stress impact analysis
  - Sleep/exercise recommendations
  - Health trend forecasting
- APIs:
  - GET /api/vitality/score - Overall health score
  - GET /api/vitality/stress - Current stress level
  - POST /api/vitality/decision - Health impact of decisions

#### Circle (Relationships)
- Database tables: relationships, social_activities, communication, support
- Services:
  - Relationship health scoring
  - Social opportunity detection
  - Connection quality analysis
  - Isolation risk assessment
- APIs:
  - GET /api/circle/relationships - Relationship health
  - GET /api/circle/social - Social opportunities
  - POST /api/circle/decision - Relationship impact

#### Foundation (Habits)
- Database tables: habits, routines, streaks, behaviors
- Services:
  - Habit tracking and scoring
  - Routine optimization
  - Behavior change recommendations
  - Consistency tracking
- APIs:
  - GET /api/foundation/habits - Active habits
  - POST /api/foundation/log - Log habit completion
  - POST /api/foundation/decision - Habit impact

#### Summit (Milestones)
- Database tables: goals, milestones, progress, achievements
- Services:
  - Goal progress tracking
  - Milestone prediction
  - Velocity calculation
  - Priority scoring
- APIs:
  - GET /api/summit/goals - All goals + progress
  - POST /api/summit/milestone - Log milestone
  - GET /api/summit/velocity - Goal progress rate

#### Echo (Legacy)
- Database tables: values, contributions, impact, inheritance
- Services:
  - Legacy scoring
  - Impact measurement
  - Value alignment analysis
  - Inheritance planning
- APIs:
  - GET /api/echo/legacy - Current legacy score
  - POST /api/echo/contribution - Log contribution
  - GET /api/echo/impact - Overall impact metrics

### Phase 3: LifeCycle Orchestration Layer

#### Central Decision Engine
- Integrates all 7 apps
- LLM-powered analysis
- Holistic recommendation system
- "Should I buy this?" analysis

#### APIs:
- `POST /api/lifecycle/decide` - Comprehensive decision analysis
- `GET /api/lifecycle/snapshot` - 7-dimension overview
- `GET /api/lifecycle/insights` - LLM-powered recommendations

## Build Timeline

**Total: ~2-3 days for complete system**

- Day 1: Initialize Vault + Build Compass, Vitality, Circle
- Day 2: Build Foundation, Summit, Echo
- Day 3: Build LifeCycle orchestration + LLM integration + Testing

## Key Design Principles

1. **Modularity**: Each app independent, no tight coupling
2. **Extensibility**: New apps can be added without breaking existing ones
3. **MCP-Ready**: All services designed for external integrations
4. **LLM-First**: Every insight leverages Claude for sophistication
5. **Real Data**: Connects to actual financial, health, social data
6. **Holistic**: No dimension viewed in isolation

## Database Design Pattern

Each app follows this pattern:

```sql
-- Core data table
CREATE TABLE app_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Historical snapshots for trends
CREATE TABLE app_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  metric_value DECIMAL,
  snapshot_date DATE,
  created_at TIMESTAMP
);

-- View for easy access
CREATE VIEW app_status_view AS
SELECT user_id, metric_value, snapshot_date
FROM app_snapshots
WHERE snapshot_date >= NOW() - INTERVAL '90 days';
```

## Service Pattern

Each app has:

```typescript
// services/compass.ts (or vitality, circle, etc)
export async function getScore(userId): Promise<number>
export async function analyzeDecision(userId, decision): Promise<Impact>
export async function getRecommendations(userId): Promise<string[]>
export async function getTrends(userId, days): Promise<Trend[]>
```

## API Pattern

Each app exposes:

```typescript
// routes/compass.ts (or vitality, circle, etc)
GET  /api/{app}/score     - Current metric score
GET  /api/{app}/trends    - Historical trends
POST /api/{app}/decision  - Analyze decision impact
GET  /api/{app}/insights  - Recommendations
```

## LifeCycle Orchestration

```typescript
// routes/lifecycle.ts
POST /api/lifecycle/decide - Comprehensive analysis across all 7 apps
GET  /api/lifecycle/snapshot - 7-dimension overview
POST /api/lifecycle/compare - Compare multiple scenarios
```

## Testing Strategy

1. **Unit tests** for each service
2. **Integration tests** for APIs
3. **E2E tests** for LifeCycle decisions
4. **Load tests** for LLM calls

## Success Criteria

- [ ] All 7 apps fully functional
- [ ] Orchestration layer working
- [ ] LLM integration complete
- [ ] Can answer: "Should I buy this $500 item?"
  - Shows financial impact
  - Shows health impact
  - Shows career impact
  - Shows relationship impact
  - Shows habit impact
  - Shows goal impact
  - Shows legacy impact
  - Overall recommendation
- [ ] All APIs tested and working
- [ ] Dashboard can display results

---

**READY TO BUILD**. Let's execute this plan.
