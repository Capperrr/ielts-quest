-- IELTS Quest 学生账号版：每位学生独立学习档案
-- 在 Supabase Dashboard > SQL Editor 中运行一次。
-- 本 SQL 只创建游戏需要的业务表。邮箱及密码由 Supabase Auth 管理。

create table if not exists public.student_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 严格限制谁能操作这张表。
alter table public.student_progress enable row level security;
revoke all on table public.student_progress from anon;
revoke all on table public.student_progress from authenticated;
grant select, insert, update on table public.student_progress to authenticated;

-- 可重复运行：更新同名策略前先删除旧策略。
drop policy if exists "students_select_own_progress" on public.student_progress;
drop policy if exists "students_insert_own_progress" on public.student_progress;
drop policy if exists "students_update_own_progress" on public.student_progress;

create policy "students_select_own_progress"
on public.student_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "students_insert_own_progress"
on public.student_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "students_update_own_progress"
on public.student_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 请在正式收学生前用两个测试账号验证：
-- A 号新增单词 -> 退出 -> B 号看不到 -> 再登录 A 号仍能看到。
-- 不要在网站 HTML 或 GitHub 仓库中放置 Supabase secret/service_role 密钥。