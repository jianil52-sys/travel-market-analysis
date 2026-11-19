"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Compass,
  Database,
  Globe2,
  Landmark,
  MapPin,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { buildDemoDashboard } from "@/app/lib/demo";
import type { DashboardResponse, DemoDataset } from "@/app/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <div className="chart-loading">正在准备趋势图…</div>,
});

const COUNTRIES = [
  { code: "US", name: "美国" },
  { code: "JP", name: "日本" },
  { code: "CN", name: "中国" },
  { code: "GB", name: "英国" },
  { code: "FR", name: "法国" },
  { code: "DE", name: "德国" },
  { code: "ES", name: "西班牙" },
  { code: "CA", name: "加拿大" },
  { code: "AU", name: "澳大利亚" },
  { code: "KE", name: "肯尼亚共和国" },
];

const formatMillions = (value: number) => `${(value / 1_000_000).toFixed(2)}M`;
const formatCompact = (value: number) =>
  new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function TrendChart({ data }: { data: DashboardResponse }) {
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 420,
      color: ["#2857a4", "#d9893d"],
      grid: { top: 28, right: 18, bottom: 28, left: 46, containLabel: false },
      legend: {
        top: 0,
        right: 4,
        itemWidth: 16,
        itemHeight: 8,
        textStyle: { color: "#64748b", fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#12263a",
        borderWidth: 0,
        textStyle: { color: "#f8fafc", fontSize: 12 },
        valueFormatter: (value) => `${formatCompact(Number(value))} 人次`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.trend.map((point) => point.period_key.replace("20", "")),
        axisLine: { lineStyle: { color: "#e8edf2" } },
        axisTick: { show: false },
        axisLabel: { color: "#8391a1", fontSize: 10, margin: 13 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 12_000_000,
        interval: 3_000_000,
        axisLabel: { color: "#8391a1", fontSize: 10, formatter: (value: number) => `${value / 1_000_000}M` },
        splitLine: { lineStyle: { color: "#edf1f5", type: "dashed" } },
      },
      series: [
        {
          name: "入境游客",
          type: "line",
          smooth: 0.26,
          showSymbol: true,
          symbolSize: 6,
          data: data.trend.map((point) => point.inbound_visitors),
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.08 },
        },
        {
          name: "出境游客",
          type: "line",
          smooth: 0.26,
          showSymbol: true,
          symbolSize: 5,
          data: data.trend.map((point) => point.outbound_visitors),
          lineStyle: { width: 2 },
        },
      ],
    }),
    [data.trend],
  );

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height: 270, width: "100%" }} />;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="delta neutral">暂无同比</span>;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`delta ${positive ? "positive" : "negative"}`}>
      <Icon size={13} strokeWidth={2.4} /> {positive ? "+" : ""}{value.toFixed(1)}%
      <span className="delta-caption">同比</span>
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="filter-control">
      <span className="filter-label">{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" size={14} />
      </span>
    </label>
  );
}

export default function Dashboard({ demoDataset }: { demoDataset: DemoDataset }) {
  const [country, setCountry] = useState("JP");
  const [year, setYear] = useState("2025");
  const [quarter, setQuarter] = useState("2");
  const [market, setMarket] = useState("all");
  const [city, setCity] = useState("all");
  const [apiConnected, setApiConnected] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse>(() =>
    buildDemoDashboard(demoDataset),
  );

  useEffect(() => {
    const fallback = buildDemoDashboard(demoDataset, country, Number(year), Number(quarter), market, city);
    setDashboard(fallback);

    const query = new URLSearchParams({
      country_code: country,
      year,
      quarter,
      market_code: market,
      city_id: city,
    });
    let current = true;

    fetch(`/api/v1/analytics/dashboard?${query.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Python API unavailable");
        return (await response.json()) as DashboardResponse;
      })
      .then((payload) => {
        if (!current) return;
        setDashboard(payload);
        setApiConnected(true);
      })
      .catch(() => {
        if (current) setApiConnected(false);
      });

    return () => {
      current = false;
    };
  }, [city, country, demoDataset, market, quarter, year]);

  const countryName = COUNTRIES.find((item) => item.code === country)?.name ?? country;
  const maxMarket = Math.max(...dashboard.markets.map((item) => item.visitors), 1);
  const maxCity = Math.max(...dashboard.cities.map((item) => item.visitors), 1);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="旅行市场分析首页">
          <span className="brand-mark"><Globe2 size={19} strokeWidth={1.8} /></span>
          <span className="brand-copy"><strong>TRAVEL SIGNALS</strong><small>MARKET INTELLIGENCE</small></span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-icon">T</span>
          <span><strong>旅行市场分析</strong><small>数据工作台</small></span>
          <ChevronDown size={14} />
        </div>

        <div className="nav-section-label">分析工作台</div>
        <nav className="side-nav" aria-label="主导航">
          <a className="nav-link active" href="#overview"><Activity size={17} />市场总览<span className="nav-active-dot" /></a>
          <a className="nav-link" href="#destinations"><MapPin size={17} />热门城市<span className="nav-count">01</span></a>
          <a className="nav-link" href="#attractions"><Landmark size={17} />景点趋势</a>
          <button className="nav-link disabled" type="button" disabled><Compass size={17} />行程攻略<span className="nav-soon">后续</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-source-icon"><Database size={15} /></div>
          <div><strong>演示数据环境</strong><small>日本 · 模拟样本</small></div>
          <span className="status-dot" />
        </div>
      </aside>

      <div className="main-column" id="top">
        <header className="topbar">
          <div className="breadcrumb"><span>分析</span><ChevronRight size={13} /><strong>市场总览</strong></div>
          <div className="topbar-right">
            <span className={`api-status ${apiConnected ? "connected" : ""}`}><i />{apiConnected ? "Python API 已连接" : "本地样例"}</span>
            <span className="topbar-divider" />
            <span className="avatar" aria-label="旅行市场分析">旅</span>
          </div>
        </header>

        <main className="dashboard-content" id="overview">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />TRAVEL MARKET OVERVIEW</div>
              <h1>旅行市场总览</h1>
              <p className="page-subtitle">追踪跨境流量、热门城市与景点热度，发现季度旅行变化。</p>
            </div>
            <div className="heading-meta">
              <span className="demo-badge"><span />模拟演示</span>
              <span className="updated-at"><CalendarDays size={14} />样例周期：{year} Q{quarter}</span>
            </div>
          </section>

          <section className="filter-panel" aria-label="数据筛选">
            <div className="filter-heading"><SlidersHorizontal size={16} /><span>筛选范围</span><span className="filter-count">5 项</span></div>
            <div className="filters">
              <FilterSelect label="目的地国家" value={country} onChange={(value) => { setCountry(value); setCity("all"); setMarket("all"); }}>
                {COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="年份" value={year} onChange={setYear}>
                <option value="2025">2025 年</option><option value="2024">2024 年</option>
              </FilterSelect>
              <FilterSelect label="季度" value={quarter} onChange={setQuarter}>
                {[1, 2, 3, 4].map((item) => <option key={item} value={item}>{`Q${item} · 第 ${item} 季度`}</option>)}
              </FilterSelect>
              <FilterSelect label="城市" value={city} onChange={setCity}>
                <option value="all">全部城市</option>
                {dashboard.available && demoDataset.cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FilterSelect>
              <FilterSelect label="游客国籍" value={market} onChange={setMarket}>
                <option value="all">全部客源市场</option>
                {dashboard.markets.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </FilterSelect>
            </div>
            <div className="filter-footnote">游客国籍筛选影响入境流量与来源构成；城市和景点指标仍展示全量统计。</div>
          </section>

          {!dashboard.available ? (
            <section className="empty-state">
              <span className="empty-icon"><Globe2 size={23} /></span>
              <h2>{countryName}的数据正在准备中</h2>
              <p>{dashboard.message}</p>
              <span className="empty-hint">当前可查看：日本 · 2024—2025 年季度样例</span>
            </section>
          ) : (
            <>
              <div className="demo-notice"><Sparkles size={15} /><span><strong>演示数据说明</strong> 当前数据为模拟样本，仅用于展示页面与筛选交互，不代表官方统计。</span><span className="notice-period">{dashboard.period_key}</span></div>

              <section className="metric-grid" aria-label="关键指标">
                <article className="metric-card metric-inbound">
                  <div className="metric-top"><span className="metric-icon blue"><ArrowDownRight size={17} /></span><span className="metric-unit">人次</span></div>
                  <div className="metric-label">{market === "all" ? "入境游客" : `${dashboard.markets.find((item) => item.code === market)?.name ?? "客源市场"} 入境游客`}</div>
                  <div className="metric-value">{formatMillions(dashboard.inbound_visitors)}</div>
                  <div className="metric-bottom"><Delta value={dashboard.inbound_yoy_pct} /><span className="metric-context">较去年同期</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span className="metric-icon amber"><ArrowUpRight size={17} /></span><span className="metric-unit">人次</span></div>
                  <div className="metric-label">出境游客</div>
                  <div className="metric-value">{formatMillions(dashboard.outbound_visitors)}</div>
                  <div className="metric-bottom"><Delta value={dashboard.outbound_yoy_pct} /><span className="metric-context">较去年同期</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span className="metric-icon teal"><MapPin size={17} /></span><span className="metric-unit">城市样本访问量</span></div>
                  <div className="metric-label">热门城市访问</div>
                  <div className="metric-value">{formatMillions(dashboard.city_visits)}</div>
                  <div className="metric-bottom"><Delta value={dashboard.city_yoy_pct} /><span className="metric-context">按城市统计口径</span></div>
                </article>
                <article className="metric-card">
                  <div className="metric-top"><span className="metric-icon violet"><Landmark size={17} /></span><span className="metric-unit">景点入场人次</span></div>
                  <div className="metric-label">热门景点访问</div>
                  <div className="metric-value">{formatMillions(dashboard.attraction_admissions)}</div>
                  <div className="metric-bottom"><Delta value={dashboard.attraction_yoy_pct} /><span className="metric-context">样本景点汇总</span></div>
                </article>
              </section>

              <section className="analysis-grid">
                <article className="panel trend-panel">
                  <div className="panel-heading">
                    <div><div className="panel-kicker">CROSS-BORDER FLOW</div><h2>出入境趋势</h2><p>日本季度访客量变化 · 单位：百万人次</p></div>
                    <button className="icon-button" type="button" aria-label="趋势图筛选"><SlidersHorizontal size={16} /></button>
                  </div>
                  <TrendChart data={dashboard} />
                  <div className="chart-foot"><span><i className="legend-dot inbound" />入境游客</span><span><i className="legend-dot outbound" />出境游客</span><span className="chart-note">季度数据为模拟序列</span></div>
                </article>

                <article className="panel market-panel">
                  <div className="panel-heading">
                    <div><div className="panel-kicker">SOURCE MARKETS</div><h2>主要客源市场</h2><p>{dashboard.period_key} 入境来源构成</p></div>
                    <button className="text-button" type="button" onClick={() => setMarket("all")}>重置 <ArrowRight size={13} /></button>
                  </div>
                  <div className="market-list">
                    {dashboard.markets.slice(0, 6).map((item, index) => (
                      <button className={`market-row ${market === item.code ? "selected" : ""}`} key={item.code} onClick={() => setMarket(market === item.code ? "all" : item.code)} type="button" aria-pressed={market === item.code}>
                        <span className="market-rank">0{index + 1}</span>
                        <span className="market-name">{item.name}</span>
                        <span className="market-bar-track"><i style={{ width: `${Math.max(5, (item.visitors / maxMarket) * 100)}%` }} /></span>
                        <span className="market-value">{formatCompact(item.visitors)}</span>
                        <span className="market-share">{item.share_pct.toFixed(1)}%</span>
                      </button>
                    ))}
                  </div>
                  <div className="market-bottom"><span>入境总量</span><strong>{formatMillions(dashboard.inbound_total_visitors)}</strong><span className="market-bottom-caption">全部客源市场</span></div>
                </article>
              </section>

              <section className="lower-grid">
                <article className="panel cities-panel" id="destinations">
                  <div className="panel-heading">
                    <div><div className="panel-kicker">DESTINATION CITIES</div><h2>热门城市</h2><p>访问量与同比变化</p></div>
                    <a className="panel-link" href="#destinations">日本 <ChevronDown size={13} /></a>
                  </div>
                  <div className="city-table-head"><span>排名 / 城市</span><span>访问人次</span><span>同比</span></div>
                  <div className="city-list">
                    {dashboard.cities.map((item, index) => (
                      <button className={`city-row ${city === item.id ? "selected" : ""}`} key={item.id} type="button" onClick={() => setCity(city === item.id ? "all" : item.id)} aria-pressed={city === item.id}>
                        <span className="city-identity"><span className={`city-rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span><span><strong>{item.name}</strong><small>日本 · 城市样本</small></span></span>
                        <span className="city-visitors"><strong>{formatCompact(item.visitors)}</strong><i><b style={{ width: `${(item.visitors / maxCity) * 100}%` }} /></i></span>
                        <span className="city-growth">+{item.yoy_pct.toFixed(1)}%</span>
                      </button>
                    ))}
                  </div>
                  <div className="panel-footer-note"><MapPin size={13} />城市访问量与入境人次为不同统计指标</div>
                </article>

                <article className="panel attractions-panel" id="attractions">
                  <div className="panel-heading">
                    <div><div className="panel-kicker">ATTRACTION PULSE</div><h2>景点热度排行</h2><p>按景点入场人次 · {dashboard.period_key}</p></div>
                    <span className="rank-badge">TOP {dashboard.attractions.length}</span>
                  </div>
                  <div className="attraction-list">
                    {dashboard.attractions.slice(0, 5).map((item, index) => (
                      <div className="attraction-row" key={item.id}>
                        <span className={`attraction-rank ${index === 0 ? "first" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                        <span className="attraction-symbol"><Landmark size={16} /></span>
                        <span className="attraction-info"><strong>{item.name}</strong><small>{item.city_name}<i />{item.category}</small></span>
                        <span className="attraction-visitors"><strong>{formatCompact(item.visitors)}</strong><small>入场人次</small></span>
                        <span className="attraction-growth">+{item.yoy_pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="panel-footer-note"><Database size={13} />景点统计按入场记录口径展示</div>
                </article>
              </section>

              <section className="data-quality-strip">
                <div className="quality-title"><span className="quality-icon"><Database size={15} /></span><div><strong>数据口径与来源</strong><small>为真实数据接入预留来源追踪字段</small></div></div>
                <div className="quality-item"><span>客源口径</span><strong>游客国籍（演示分类）</strong></div>
                <div className="quality-item"><span>时间粒度</span><strong>年度 · 季度</strong></div>
                <div className="quality-item"><span>数据状态</span><strong className="quality-demo"><i />模拟数据</strong></div>
                <a className="quality-link" href="#overview">查看说明<ChevronRight size={14} /></a>
              </section>

              <footer className="page-footer"><span>TRAVEL SIGNALS <i />市场趋势分析</span><span>演示页面 · 数据需由官方来源核验后替换</span></footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
