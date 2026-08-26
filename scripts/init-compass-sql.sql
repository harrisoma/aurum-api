-- COMPASS: Career Intelligence Tables

CREATE TABLE IF NOT EXISTS career_goals (
  id TEXT,
  user_id TEXT,
  title TEXT,
  description TEXT,
  target_date TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT,
  user_id TEXT,
  skill_name TEXT,
  proficiency_level DECIMAL,
  years_experience DECIMAL,
  endorsements DECIMAL,
  last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_milestones (
  id TEXT,
  user_id TEXT,
  milestone_name TEXT,
  achieved_date TEXT,
  significance TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_opportunities (
  id TEXT,
  user_id TEXT,
  job_title TEXT,
  company TEXT,
  match_score DECIMAL,
  posted_date TEXT,
  status TEXT,
  created_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_goals_user ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON career_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user ON job_opportunities(user_id);
