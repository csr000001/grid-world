-- ============================================
-- Grid World 数据库架构 (Supabase)
-- ============================================

-- 1. 创建grids表（格子主表）
CREATE TABLE IF NOT EXISTS grids (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_days INTEGER DEFAULT 30,
  like_count INTEGER DEFAULT 0,
  curtain_color VARCHAR(20) DEFAULT '#80808080',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_grids_user_id ON grids(user_id);
CREATE INDEX IF NOT EXISTS idx_grids_storage_days ON grids(storage_days);

-- 2. 创建grid_likes表（点赞记录表，防止重复点赞）
CREATE TABLE IF NOT EXISTS grid_likes (
  id BIGSERIAL PRIMARY KEY,
  grid_id BIGINT REFERENCES grids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grid_id, user_id) -- 确保每个用户对同一格子只能点赞一次
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_grid_likes_grid_id ON grid_likes(grid_id);
CREATE INDEX IF NOT EXISTS idx_grid_likes_user_id ON grid_likes(user_id);

-- 3. 初始化10000个空白格子
INSERT INTO grids (id, user_id, storage_days, like_count, curtain_color, photo_url)
SELECT
  generate_series(1, 10000) AS id,
  NULL AS user_id,
  30 AS storage_days,
  0 AS like_count,
  '#80808080' AS curtain_color,
  NULL AS photo_url
ON CONFLICT (id) DO NOTHING;

-- 4. 创建存储桶（用于存储用户上传的照片）
-- 注意：这需要在Supabase Dashboard中手动创建，或使用Supabase CLI
-- 存储桶名称: grid-photos
-- 公开访问: 是
-- 文件大小限制: 5MB
-- 允许的文件类型: image/jpeg, image/png, image/gif, image/webp

-- 5. 设置RLS（行级安全策略）
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_likes ENABLE ROW LEVEL SECURITY;

-- grids表策略：所有人可读，只有所有者可更新
CREATE POLICY "grids_select_policy" ON grids FOR SELECT USING (true);
CREATE POLICY "grids_update_policy" ON grids FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "grids_insert_policy" ON grids FOR INSERT WITH CHECK (true);

-- grid_likes表策略：所有人可读，只有登录用户可插入
CREATE POLICY "grid_likes_select_policy" ON grid_likes FOR SELECT USING (true);
CREATE POLICY "grid_likes_insert_policy" ON grid_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. 创建自动扩展格子的函数（当填充率超过50%时）
CREATE OR REPLACE FUNCTION auto_expand_grids()
RETURNS TRIGGER AS $$
DECLARE
  total_grids INTEGER;
  filled_grids INTEGER;
  fill_rate NUMERIC;
  max_grids INTEGER := 100000000; -- 1亿上限
  expand_step INTEGER := 10000;
BEGIN
  -- 计算当前总格子数和已填充格子数
  SELECT COUNT(*) INTO total_grids FROM grids;
  SELECT COUNT(*) INTO filled_grids FROM grids WHERE user_id IS NOT NULL;

  -- 计算填充率
  fill_rate := filled_grids::NUMERIC / total_grids::NUMERIC;

  -- 如果填充率超过50%且未达到上限，则扩展10000个格子
  IF fill_rate >= 0.5 AND total_grids < max_grids THEN
    INSERT INTO grids (user_id, storage_days, like_count, curtain_color, photo_url)
    SELECT
      NULL,
      30,
      0,
      '#80808080',
      NULL
    FROM generate_series(1, LEAST(expand_step, max_grids - total_grids));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（每次更新grids表时检查是否需要扩展）
CREATE TRIGGER trigger_auto_expand_grids
AFTER UPDATE ON grids
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL AND OLD.user_id IS NULL)
EXECUTE FUNCTION auto_expand_grids();

-- 7. 创建定时任务：每天减少storage_days（需要pg_cron扩展）
-- 注意：Supabase默认不启用pg_cron，需要在Dashboard中启用
-- 或者使用Supabase Edge Functions定时调用
CREATE OR REPLACE FUNCTION decrease_storage_days()
RETURNS void AS $$
BEGIN
  UPDATE grids
  SET storage_days = GREATEST(storage_days - 1, 0)
  WHERE user_id IS NOT NULL AND storage_days > 0;
END;
$$ LANGUAGE plpgsql;

-- 如果启用了pg_cron，可以使用以下命令创建定时任务
-- SELECT cron.schedule('decrease-storage-days', '0 0 * * *', 'SELECT decrease_storage_days()');

-- ============================================
-- 使用说明
-- ============================================
-- 1. 在Supabase Dashboard中执行此SQL脚本
-- 2. 在Storage中创建名为"grid-photos"的公开存储桶
-- 3. 配置存储桶策略：允许登录用户上传，所有人可读
-- 4. 如需自动减少storage_days，需启用pg_cron扩展或使用Edge Functions
-- 5. 环境变量配置：
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY (用于服务端操作)
