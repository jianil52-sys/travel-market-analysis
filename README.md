# 旅行市场分析 / Travel Signals

Next.js 分析首页 + FastAPI 演示 API。首个演示国家为日本；`data/demo-japan.json` 中的所有数量均为模拟数据，不是官方统计，也不应作为旅行决策依据。

## 前端

需要 Node.js 与 npm：

```powershell
npm install
npm run dev
```

打开 `http://localhost:3000`。首页会先用本地样例立即呈现，随后尝试读取 FastAPI；服务未启动时会继续展示本地样例。

## Python API

在另一个终端运行：

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

接口：

- `GET /api/health`
- `GET /api/v1/analytics/dashboard?country_code=JP&year=2025&quarter=2`

前端开发服务器会把 `/api/*` 转发到本地 FastAPI。Vercel Services 尚未配置；部署阶段再把 `/api` 路径接到 Python 服务。

## 数据状态

- 当前唯一可展示数据：日本，2024–2025 年季度模拟样本。客源拆分字段按“游客国籍”建模，所有数值仍为模拟数据。
- 国家筛选已包含美国、日本、中国、英国、法国、德国、西班牙、加拿大、澳大利亚和肯尼亚共和国；其他国家显示数据待接入状态。
- 城市和景点的季度样例由演示基准值按模拟趋势缩放，仅用于交互预览。
- Neon schema 草案位于 `backend/schema.sql`。当前没有 Neon 凭证，页面和 API 不会连接或写入数据库。
- 真实数据接入前，需要逐条核验来源、许可、统计口径与更新时间。尤其要分清国籍、居住地、客源市场，以及入境人次、城市访问量和景点入场人次。
