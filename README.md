# dsh-liquid-glass-balance-card-enhanced

A draggable **liquid-glass floating card** for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) **web GUI** that shows your **DeepSeek API balance**, **official cumulative spend**, and **official token usage** — now with **7 card themes** and **real-time data straight from platform.deepseek.com**.

一个给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）**网页界面** 使用的插件：在页面右上角显示 **DeepSeek API 余额**、**官网累计消费** 与 **官网 Token 用量**，支持 **7 套卡片主题** 与 **可拖动的液态玻璃卡片**。

> ### 🙏 Credits / 原作者与来源
>
> This project is an **enhanced fork** of [**dsh-liquid-glass-balance-card**](https://github.com/SoDaZilla-zzz/dsh-liquid-glass-balance-card), originally created by [**sooodaaa** (@SoDaZilla-zzz)](https://github.com/SoDaZilla-zzz).
>
> 本项目是 [**dsh-liquid-glass-balance-card**](https://github.com/SoDaZilla-zzz/dsh-liquid-glass-balance-card) 的**增强分支**，原作者为 [**sooodaaa**（@SoDaZilla-zzz）](https://github.com/SoDaZilla-zzz)。原项目的 MIT 协议与版权声明完整保留。
>
> **Enhanced 版新增 / What's new in this fork**
>
> - **官网实时数据**：余额、累计消费、Token 用量全部直读 `platform.deepseek.com`，与官网 `/usage` 页一致，不再本地估算
> - **7 套卡片主题**：液态玻璃、纸白、晨雾、奶油、静夜、深空、霓虹
> - **按模型明细**：按模型展示请求数、命中/未命中/输出 Tokens 与花费
> - **消费 / Tokens 趋势图**：近 7 天、近 30 天液态玻璃柱状图
> - **卡片尺寸调节**：宽度与最小高度
> - **独立命名空间**：包名、模块 ID、API 路由、localStorage 键、CSS 前缀全部独立，可与原版同时安装
>
> 原版作者与项目链接：**sooodaaa** · https://github.com/SoDaZilla-zzz · https://github.com/SoDaZilla-zzz/dsh-liquid-glass-balance-card

<p align="center">
  <img src="docs/cover.jpg" alt="dsh-liquid-glass-balance-card-enhanced cover" width="100%">
</p>

---

## 🎬 Demo / 效果演示

![Demo GIF](docs/demo.gif)

<video src="docs/demo.mp4" controls muted loop playsinline width="100%"></video>

> GIF 预览 · 完整视频见下方播放器。演示素材来自上游原版，Enhanced 版新增主题与官网用量面板见下文说明。
>
> Full demo: liquid glass, 3D thickness, color customization, balance & usage stats, and top-up entry.

---

## ✨ Features / 功能

| English | 中文 |
| --- | --- |
| Floating card in the top-right corner by default | 默认悬浮在右上角 |
| Draggable; position is remembered in `localStorage` | 可拖动，位置自动保存在浏览器 `localStorage` |
| **7 themes**: Liquid Glass, Paper, Mist, Cream, Midnight, Deep Space, Neon | **7 套主题**：液态玻璃、纸白、晨雾、奶油、静夜、深空、霓虹 |
| Liquid Glass effect with adjustable parameters | 液态玻璃效果，参数可实时调节 |
| 3D thickness effect with toggle, depth and side-angle controls | 3D 立体厚度效果：可开关、调节厚度与侧向角度 |
| Adjustable card width and minimum height | 卡片宽度与最小高度可调 |
| Custom glass color while keeping liquid glass properties | 自定义玻璃颜色，调节后仍保持液态玻璃特性 |
| **Official balance** from `platform.deepseek.com` (falls back to `/user/balance`) | **官网余额**（`platform.deepseek.com`，无登录态时回退官方 `/user/balance`） |
| **Official cumulative spend** (`total_costs`) | **官网累计消费**（`total_costs`） |
| Shows total balance, availability, granted & topped-up balance | 显示总余额、可用状态、赠送余额与充值余额 |
| **Official token usage & spend by model** | **官网按模型的 Token 用量与花费明细** |
| Time ranges: Today / Yesterday / Last 7 days / Last 30 days | 时间维度：今天 / 昨天 / 近7天 / 近30天 |
| Liquid-glass bar charts for 7d/30d spend & token trends | 近7天/近30天液态玻璃柱状图展示消费与 Token 趋势 |
| One-click DeepSeek top-up link | 一键跳转 DeepSeek 官方充值入口 |
| Manual API key input in the card settings | 支持在卡片设置中手动填写 API Key |
| Falls back to the DSH `DEEPSEEK_API_KEY` credential | 未填写手动 Key 时自动使用 DSH 已配置的 `DEEPSEEK_API_KEY` |
| Auto-refresh every 60 seconds + manual refresh | 每 60 秒自动刷新，也可手动刷新 |
| Follows DSH light/dark theme variables (`--dsw-*`) | 跟随 DSH 明暗主题变量（`--dsw-*`） |
| Independent namespace, installs next to the original | 独立命名空间，可与原版同时安装 |

---

## 📦 Install / 安装

Requires the DSH CLI and [pnpm](https://pnpm.io/installation).

需要 DSH CLI 与 [pnpm](https://pnpm.io/installation)。

### From source (recommended) / 从源码安装（推荐）

```sh
git clone https://github.com/CyberCoder-ByteWizard/dsh-liquid-glass-balance-card-enhanced.git
dsh plugin --profile web add ./dsh-liquid-glass-balance-card-enhanced
```

Restart DSH Web / 重启 DSH Web：

```sh
dsh web
```

Open http://127.0.0.1:3080 and refresh the page. The card appears in the top-right corner.

打开 http://127.0.0.1:3080 并刷新页面，右上角会出现卡片。

### Manual install / 手动安装

Put the package into the profile's `node_modules`, then add a loader entry to `~/.dsh/profiles/web/cordis.patch.yml`:

将包放入 profile 的 `node_modules`，并在 `~/.dsh/profiles/web/cordis.patch.yml` 中加入：

```yaml
- insert:
    - id: liquid-glass-balance-card-enhanced
      name: dsh-liquid-glass-balance-card-enhanced
```

> **Coexistence / 与原版共存**：Enhanced 版使用独立的包名、模块 ID、API 路由
> （`/api/liquid-glass-balance-card-enhanced/*`）、宿主状态文件、`localStorage`
> 键与 CSS 前缀 `dsbce-`，因此可以和原版 `dsh-liquid-glass-balance-card` 同时安装，
> 不会互相覆盖设置或样式。

---

## ⚙️ Configuration / 配置

### Official usage token (recommended) / 官网登录态（推荐）

Enhanced 版的余额、累计消费和 Token 用量都优先读取官网数据，需要一次登录态 token：

1. 登录 https://platform.deepseek.com ；
2. 打开浏览器开发者工具 → Console，输入 `localStorage.userToken` 回车；
3. 复制整段返回值（形如 `{"value":"…","__version":"0"}`，也可只复制 `value` 字段）；
4. 打开卡片右上角齿轮 → 「官网实时用量」→ 粘贴 → 保存。

> Token 只保存在宿主侧 `$DSH_HOME/storages/dsh-liquid-glass-balance-card-enhanced.json`，
> 浏览器只看到掩码。登录态过期后重新获取一次即可。
>
> 官网用量接口最多支持约 **31 天** 回溯，因此时间维度提供今天 / 昨天 / 近7天 / 近30天。

### API Key (balance fallback) / API Key（余额兜底）

Click the gear icon on the card to open settings:

点击卡片右上角的齿轮图标打开设置：

1. Paste a DeepSeek API Key and click **Save** / 粘贴 DeepSeek API Key 并点击「保存」；
2. The key is stored on the host under `$DSH_HOME/storages/dsh-liquid-glass-balance-card-enhanced.json`; the browser only sees a masked value / Key 保存在宿主侧，浏览器只显示掩码；
3. Click **Clear** to remove the manual key and fall back to the DSH `DEEPSEEK_API_KEY` / 点击「清除」可删除手动 Key，之后回退使用 DSH 自身的 `DEEPSEEK_API_KEY`。

> Manual key takes priority. If neither is configured, the card shows a clear error.
>
> 手动 Key 优先于 DSH 已配置的 `DEEPSEEK_API_KEY`。若两者都没有，卡片会显示明确的错误提示。

### Themes / 卡片主题

点击卡片右上角的主题图标即可实时切换：

| Group / 分组 | Theme / 主题 |
| --- | --- |
| 默认 | 液态玻璃 |
| 亮色 | 纸白、晨雾、奶油 |
| 暗调 | 静夜、深空、霓虹 |

实色主题使用独立的底色 / 描边 / 阴影 / 强调色，同时覆盖 DSH 的 `--dsw-*` 语义色，保证卡片内部所有部件同一套配色。

### Liquid Glass Parameters / 玻璃效果参数

All parameters are adjustable in real time in the settings panel:

所有参数均可在设置面板实时调节：

| Parameter / 参数 | Range / 范围 |
| --- | --- |
| Transparency / 透明度 | 0% ~ 80% |
| Background blur / 背景模糊 | 0px ~ 40px |
| Saturation / 饱和度 | 100% ~ 300% |
| Highlight intensity / 高光强度 | 0% ~ 100% |
| Moving shine / 流动光线 | 0% ~ 50% |
| 3D thickness / 3D 立体厚度 | 0px ~ 40px（可开关） |
| Side angle / 侧向角度 | -30° ~ 30° |
| Card width / 卡片宽度 | 220px ~ 420px |
| Min height / 最小高度 | 0px ~ 400px（0 = 自适应） |
| Glass color / 玻璃颜色 | 自定义取色器（保持液态玻璃特性） |

Settings are saved in `localStorage` and a **Reset to default** button is provided.

参数保存在浏览器 `localStorage`，并提供「恢复默认」按钮。

### Usage Statistics / 用量统计

The card shows official spend, official token totals, per-model breakdown and daily charts:

卡片显示官网累计消费、官网 Token 总量、按模型明细与每日趋势：

- Today / 今天
- Yesterday / 昨天
- Last 7 days / 近7天
- Last 30 days / 近30天

All numbers come from DeepSeek's official servers — nothing is estimated locally.

所有数字均来自 DeepSeek 官方服务器，不做任何本地估算。

---

## 🔒 Privacy / 隐私说明

- Your API key and platform login token never leave your machine. The browser only talks to local host routes.
- API Key 与登录 token 不会离开你的机器，浏览器只访问本地宿主路由。
- Tokens are stored on the host with `0600` permissions; the UI only renders masked values.
- token 以 `0600` 权限保存在宿主侧，界面只显示掩码。
- No analytics, no tracking, no remote telemetry.
- 无统计、无追踪、无远程遥测。
- The published source and release package contain **no** credentials or personal tokens.
- 发布源码与安装包中**不含**任何凭据或个人信息。

---

## 🏗 Architecture / 工作原理

| Part / 部分 | File / 文件 | Responsibility / 作用 |
| --- | --- | --- |
| Host / 宿主侧 | `lib/index.js` | Local routes: settings, balance, stats; official platform client / 注册本地路由：设置、余额、统计；请求官网接口 |
| Browser / 浏览器侧 | `lib/client.js` | `shell.overlay` floating card, themes, drag, glass sliders, stats UI, recharge link / `shell.overlay` 悬浮卡片、主题、拖动、玻璃参数、统计 UI、充值入口 |
| Composition / 组合层 | `cordis.patch.yml` | Bundle patch layer / bundle 补丁层 |

### Official data sources / 官网数据来源

| Endpoint | Purpose / 用途 |
| --- | --- |
| `GET https://platform.deepseek.com/api/v0/users/get_user_summary` | 余额钱包 + 官方累计消费 |
| `GET https://platform.deepseek.com/api/v0/usage/by_api_key/amount` | 官网 Token 用量（按模型 × 按天） |
| `GET https://platform.deepseek.com/api/v0/usage/by_api_key/cost` | 官网金额用量（按模型 × 按天） |
| `GET https://api.deepseek.com/user/balance` | 无登录态时的官方余额兜底 |

`amount` 的 `series[]` 与 `cost` 的 `data[].series[]` 每条都带 `model` 字段，按模型聚合即可得到与官网「调用类型」页签一致的数据。

---

## 🛠 Development / 开发

```sh
git clone https://github.com/CyberCoder-ByteWizard/dsh-liquid-glass-balance-card-enhanced.git
cd dsh-liquid-glass-balance-card-enhanced
# edit lib/index.js or lib/client.js, then install locally:
# 修改 lib/index.js 或 lib/client.js 后本地安装测试：
dsh plugin --profile web add .
```

After changing `lib/client.js`, restart `dsh web` and hard-refresh the page. After changing host code (`lib/index.js`), a restart is required.

修改 `lib/client.js` 后重启 `dsh web` 并强制刷新页面；修改宿主代码（`lib/index.js`）后需要重启 DSH Web。

---

## 📄 License / 协议

[MIT](./LICENSE)

Original work © [sooodaaa (@SoDaZilla-zzz)](https://github.com/SoDaZilla-zzz) · Enhanced fork maintained by the repository owner.

原项目版权归 [sooodaaa（@SoDaZilla-zzz）](https://github.com/SoDaZilla-zzz) 所有；增强分支由本仓库维护者维护。
