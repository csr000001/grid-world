-- Grid World Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_grids_owned INTEGER DEFAULT 0,
  total_likes_given INTEGER DEFAULT 0
);

-- Grids table (main grid cells)
CREATE TABLE grids (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  color VARCHAR(7) NOT NULL, -- hex color code #RRGGBB
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
  is_visible BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id BIGINT REFERENCES grids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  days_extended INTEGER DEFAULT 1, -- how many days this like added
  UNIQUE(grid_id, user_id) -- one like per user per grid
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  grid_id BIGINT REFERENCES grids(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_provider VARCHAR(20) NOT NULL, -- paypal
  payment_intent_id VARCHAR(255),
  transaction_type VARCHAR(20) NOT NULL, -- purchase, modification, deletion
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Reviews table (moderation)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id BIGINT REFERENCES grids(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_type VARCHAR(20) NOT NULL, -- human, ai
  decision VARCHAR(20) NOT NULL, -- approved, rejected, flagged
  reason TEXT,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00 for AI reviews
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grid capacity tracking
CREATE TABLE grid_capacity (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_capacity BIGINT DEFAULT 10000,
  occupied_count BIGINT DEFAULT 0,
  last_expansion_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial capacity record
INSERT INTO grid_capacity (id, total_capacity, occupied_count)
VALUES (1, 10000, 0);

-- Indexes for performance
CREATE INDEX idx_grids_owner ON grids(owner_id);
CREATE INDEX idx_grids_status ON grids(status);
CREATE INDEX idx_grids_expires_at ON grids(expires_at);
CREATE INDEX idx_grids_visible ON grids(is_visible);
CREATE INDEX idx_likes_grid ON likes(grid_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_reviews_grid ON reviews(grid_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grids_updated_at BEFORE UPDATE ON grids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to extend grid expiration on like
CREATE OR REPLACE FUNCTION extend_grid_expiration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE grids
  SET
    expires_at = LEAST(
      expires_at + INTERVAL '1 day',
      created_at + INTERVAL '9999 days'
    ),
    likes_count = likes_count + 1
  WHERE id = NEW.grid_id;

  UPDATE users
  SET total_likes_given = total_likes_given + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like extension
CREATE TRIGGER on_like_extend_expiration AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION extend_grid_expiration();

-- Function to check and expand grid capacity
CREATE OR REPLACE FUNCTION check_and_expand_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_capacity BIGINT;
  current_occupied BIGINT;
  fill_percentage DECIMAL;
BEGIN
  SELECT total_capacity, occupied_count
  INTO current_capacity, current_occupied
  FROM grid_capacity WHERE id = 1;

  fill_percentage := (current_occupied::DECIMAL / current_capacity) * 100;

  IF fill_percentage > 50 AND current_capacity < 100000000 THEN
    UPDATE grid_capacity
    SET
      total_capacity = LEAST(total_capacity + 10000, 100000000),
      last_expansion_at = NOW()
    WHERE id = 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for capacity expansion
CREATE TRIGGER on_grid_insert_check_capacity AFTER INSERT ON grids
  FOR EACH ROW EXECUTE FUNCTION check_and_expand_capacity();

-- Function to update occupied count
CREATE OR REPLACE FUNCTION update_occupied_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE grid_capacity SET occupied_count = occupied_count + 1 WHERE id = 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE grid_capacity SET occupied_count = occupied_count - 1 WHERE id = 1;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for occupied count
CREATE TRIGGER on_grid_change_update_count AFTER INSERT OR DELETE ON grids
  FOR EACH ROW EXECUTE FUNCTION update_occupied_count();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view approved and visible grids
CREATE POLICY grids_select_public ON grids
  FOR SELECT USING (status = 'approved' AND is_visible = true);

-- Users can view their own grids
CREATE POLICY grids_select_own ON grids
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can insert grids
CREATE POLICY grids_insert_authenticated ON grids
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can like grids
CREATE POLICY likes_insert_authenticated ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own likes
CREATE POLICY likes_select_own ON likes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (auth.uid() = user_id);
