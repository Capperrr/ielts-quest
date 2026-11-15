# LUMINA 3.0 — BEATSHIFT / 霓光节奏

原创 Three.js 霓虹都市电子音乐游戏；三首原创 Web Audio 曲目，完全无需登录。

游戏地址（合并发布后）：https://capperrr.github.io/ielts-quest/lumina-run/

## 三首曲目

| 关卡 | 歌曲 | 类型 | BPM | 新玩法 |
|---|---|---|---:|---|
| 01 霓光高架 | AURORA DRIVE | Synthwave | 100 | HIT 节奏判定 |
| 02 天轨城区 | SKYLINE ZERO | Future Bass | 128 | HOLD 长音符 |
| 03 核心塔区 | NEXUS OVERDRIVE | Drum & Bass | 160 | 高速音符与核心哨兵 |

## 操作

← / → 或 A / D 选择航道，Space / J / 手机中央 HIT 在音符穿过判定线时敲击；紫色长音符需要按住。
K / Shift / 手机右上 BEAT DROP 可清除附近的无人机、补充同步能量，准确踩到鼓点会有额外分数。

PERFECT ≤ 90ms / GREAT ≤ 190ms / GOOD ≤ 300ms，超过即 MISS。连续命中积累 FEVER，触发8秒双倍得分及城市灯光反馈。

命中一定数量音符、保留同步能量并坚持到歌曲结尾，即可解锁下一首歌。结算含评级、星星及判定统计。

## 音画同步

曲目由原创的振荡器旋律、贝斯、电子和弦、鼓组和噪声打击组成，不包含商业歌曲及未经许可的音频素材。
音频以 AudioContext.currentTime 作为节拍调度与音符判定的时钟；画面丢帧不会改变音符的目标音频时间。首次播放需要用户点击。
暂停与恢复会保留歌曲相对位置；音频可静音而歌曲时钟继续。某些移动浏览器会限制音频恢复或具有硬件输出延迟。

## 测试

命令：node lumina-run/verify.cjs
命令：node lumina-run/smoke.cjs（在安装 Playwright/Chromium 和运行本地静态服务器后）

GitHub Actions 检查音符表、BPM、判定阈值、页面和三关解锁，并在 Chromium 测试手机操作、音符命中计分和 BEAT DROP。
模拟浏览器验证不等于真实 iPhone/iPad 的延迟校准。蓝牙耳机可能产生额外音频延迟。

这次更新不会覆盖仓库其他项目，也会沿用此前的关卡存档。
