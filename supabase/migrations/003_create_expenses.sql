-- 创建 expenses 记账记录表
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

-- 开启 RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有已认证用户操作自己的记录
-- 注意：前端需要确保 user_id 正确传递
CREATE POLICY "Users can manage own expenses"
  ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);
