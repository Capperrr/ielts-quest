# IELTS Quest：腾讯云学生账号测试分支

> 仅用于测试。本分支不修改 main、腾讯云线上游戏或任何后台密钥。提交代码本身**不会**开通注册、创建数据库或自动部署网页。

## 已加入
- 已恢复学生用**用户名 + 密码**登录；**班级邀请码仅在自主注册时输入**，并必须交由可信服务端校验，不强制邮箱或手机。
- 将学生注册请求发往现有 HTTP 网关函数 `/api/ielts-student-register/register`（后端需要先完成安全测试）。
- 通过 CloudBase JS SDK v3 `signInWithPassword({username,password})` 登录、`getSession()` 恢复会话。
- 通过 `app.rdb().from('student_progress')` 读取、保存每个学生的游戏状态；数据库必须实施 RLS。
- 未配置有效 Publishable Key 时继续运行原始**本机试玩版**；不自动覆盖浏览器旧进度。
- 原有关卡、题库、金币、倒计时、AI 作文界面都保留。

## 需要平台配置，缺一不可
1. 在 **CloudBase / API Key 配置**确认浏览器允许公开的 **Publishable Key** 已配置。公开 Key 不是管理员密钥；变更时仅更新 `index.html` 的 `CLOUD_CONFIG.publishableKey`。**绝不**把 CAM SecretId、SecretKey、`sb_secret_...` 或 service_role 放进网页或 GitHub！
2. 确认云开发环境 ID `ielts-quest-d8gzj6qo48301e5d5`、地域 ap-shanghai、用户名密码登录方式已开启。
3. 确认当前环境已启用 **CloudBase PostgreSQL**。在 SQL 编辑器执行 `cloudbase_progress_setup.sql`，验证 `student_progress` 的权限策略确实生效；如果环境未开通 PostgreSQL，不要把此分支提供给学生。
4. 把此前意外在截图中暴露、已禁用的 API 密钥**彻底撤销或删除**，为子用户创建新的限权凭证，并仅配置在服务端 `TCB_SECRET_ID` / `TCB_SECRET_KEY` 环境变量中。关闭 `REGISTRATION_ENABLED` 直到测试。此仓库未包含服务端函数源代码，必须在腾讯云控制台核验它实际运行的版本。
5. 校对 `ALLOWED_ORIGIN`：需要与**测试页面实际站点 Origin** 完全一致。GitHub 分支页面如果部署在不同域名，须配置独立测试 Origin。CloudBase HTTP 网关 CORS 也需允许这个源；Origin Header 不是认证，不能代替服务端邀请码和防滥用。
6. 现有注册 HTTP 函数需要正式的**持久化**限流、一次性或可撤销邀请码、错误返回不泄露账号存在性、最小权限后台身份、风控与账号找回方案，才能向全体学生开放。

## 两账号隔离验收（必须手动执行）
1. 保持 `main` 网站不变，将此测试分支部署到**独立测试目录/域名**。
2. 先检查页面仍保留各题型、关卡、题库、错题本和作文评估界面。
3. 后端测试开关暂时开启后用两个独立测试账号 A、B 注册，使用邀请码；验证无邀请码和错误邀请码都被拒绝。
4. 登录 A，新增自定义词、做题并产生金币和错题；等待“☁️ 已保存”再退出。
5. 登录 B，确认 B 无法查看 A 的进度；重复 A 的 `user_id` 尝试数据库操作，RLS 必须拒绝。
6. 重新登录 A，确认云端存档恢复；另一设备登录 A 再确认跨设备恢复。
7. 检查刷新会话、登出、断网保存失败提示、注册关闭时的返回码，以及云函数日志。
8. 完成测试后关闭注册开关，再决定何时发布。**不得因为静态检查通过就声称线上已可用。**

## 代码校验
在 Node.js 20+ 环境，从仓库根目录运行：
`node scripts/verify-staging.mjs`

此脚本检查 JS 语法、关键游戏结构、账号连接标记和 RLS 策略，但不替代真机浏览器或服务端集成测试。

## 注意
- 现有浏览器本机 Lv.4、375 金币等数据不会自动绑定到任何学生账号，避免多人共用设备时串档。后续可添加用户明确确认的单次导入流程。
- AI 作文草稿仍按原版保存在浏览器本地，不属于 `student_progress`，不要误认为已云端同步。
- `index.html` 的 CloudBase SDK CDN 使用官方文档建议的 `latest`，上线前应经过兼容性验证后锁定经测试的 v3 版本。

## 2026-11-14 测试分支恢复说明
- 已将 `index.html` 恢复到此前 **用户名 + 密码 + 班级邀请码注册** 的版本，保留原本游戏与云端档案调用结构，不改生产 `main`。
- 当前 CloudBase 注册云函数还**未通过**端到端验证，曾报告 `AuthFailure.UnauthorizedOperation`；此问题必须在服务端排查解决。
- WorkBuddy 开发任务和验收标准见 `WORKBUDDY_CLOUDBASE_INVITE_TASK.md`。
