-- 创建手机验证码存储表
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);

-- 在 users 表中添加 phone 字段（如果还没有的话）
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
