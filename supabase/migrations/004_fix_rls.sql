-- 授予 anon 角色对 expenses 表的权限
GRANT ALL ON expenses TO anon, authenticated;
GRANT ALL ON expenses TO anon, authenticated;

-- 重新创建 RLS 策略（确保正确）
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;

CREATE POLICY "Users can manage own expenses"
  ON expenses
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 验证策略
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'expenses';
