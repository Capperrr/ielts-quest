-- IELTS Quest / CloudBase PostgreSQL (staging)
-- 在测试环境 PostgreSQL SQL 编辑器执行；不要在 Supabase 运行此文件。
-- CloudBase 用户标识来自 auth.uid()，由数据库 RLS 强制隔离。
-- 本脚本不会创建账号，也不涉及用户密码。
CREATE TABLE IF NOT EXISTS public.student_progress (
  user_id text PRIMARY KEY DEFAULT (auth.uid())::text,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.student_progress FROM anon;
REVOKE ALL ON TABLE public.student_progress FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_progress TO authenticated;

DROP POLICY IF EXISTS ielts_progress_select_own ON public.student_progress;
DROP POLICY IF EXISTS ielts_progress_insert_own ON public.student_progress;
DROP POLICY IF EXISTS ielts_progress_update_own ON public.student_progress;

CREATE POLICY ielts_progress_select_own ON public.student_progress
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);
CREATE POLICY ielts_progress_insert_own ON public.student_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);
CREATE POLICY ielts_progress_update_own ON public.student_progress
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- 不授予 DELETE；无 INSERT/UPDATE/SELECT 权限的匿名客户端无法读取档案。
-- 重要：RLS 必须启用；仅在前端按 user_id 过滤不能代替 RLS。
