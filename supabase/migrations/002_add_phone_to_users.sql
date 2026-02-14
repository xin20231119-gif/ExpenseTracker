-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 添加 RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- 允许所有人插入
CREATE POLICY "users can be inserted by everyone" ON users
  FOR INSERT WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "users can be updated by everyone" ON users
  FOR UPDATE USING (true);
