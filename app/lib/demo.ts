import type { DashboardResponse, DemoDataset, TrendPoint } from "@/app/types";

function growth(current: number, previous?: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function scale(value: number, ratio: number): number {
  return Math.round(value * ratio);
}

export function buildDemoDashboard(
  dataset: DemoDataset,
  countryCode = dataset.country.code,
  year = 2025,
  quarter = 2,
  marketCode = "all",
  cityId = "all",
): DashboardResponse {
  const country = countryCode.toUpperCase();
  const period = dataset.trend.find((point) => point.year === year && point.quarter === quarter);
  const periodKey = `${year}-Q${quarter}`;

  const empty: DashboardResponse = {
    available: false,
    is_demo: true,
    country_code: country,
    country_name: country === dataset.country.code ? dataset.country.name : country,
    year,
    quarter,
    period_key: periodKey,
    inbound_visitors: 0,
    inbound_total_visitors: 0,
    outbound_visitors: 0,
    city_visits: 0,
    attraction_admissions: 0,
    inbound_yoy_pct: null,
    outbound_yoy_pct: null,
    city_yoy_pct: null,
    attraction_yoy_pct: null,
    selected_market: marketCode,
    selected_city: cityId,
    markets: [],
    cities: [],
    attractions: [],
    trend: [],
    source_label: dataset.source_label,
    message:
      country !== dataset.country.code
        ? "当前最小演示仅包含日本。其他国家的数据接入后会在此展示。"
        : "所选季度暂无演示数据，请调整年份或季度。",
  };

  if (country !== dataset.country.code || !period) return empty;

  const base = dataset.trend.find((point) => point.period_key === dataset.base_period);
  if (!base) return empty;

  const inboundRatio = period.inbound_visitors / base.inbound_visitors;
  const cityRatio = period.city_visits / base.city_visits;
  const attractionRatio = period.attraction_admissions / base.attraction_admissions;
  const previous = dataset.trend.find(
    (point) => point.year === year - 1 && point.quarter === quarter,
  );

  const markets = dataset.markets.map((market) => {
    const visitors = scale(market.visitors, inboundRatio);
    return {
      ...market,
      visitors,
      share_pct: Math.round((visitors / period.inbound_visitors) * 1000) / 10,
    };
  });

  const cities = dataset.cities
    .map((city) => ({ ...city, visitors: scale(city.visitors, cityRatio) }))
    .filter((city) => cityId === "all" || city.id === cityId)
    .sort((a, b) => b.visitors - a.visitors);

  const attractions = dataset.attractions
    .map((attraction) => ({
      ...attraction,
      visitors: scale(attraction.visitors, attractionRatio),
    }))
    .filter((attraction) => cityId === "all" || attraction.city_id === cityId)
    .sort((a, b) => b.visitors - a.visitors);

  const selectedMarket = markets.find((market) => market.code === marketCode);
  const selectedInbound = selectedMarket?.visitors ?? period.inbound_visitors;
  const selectedInboundPrevious = previous
    ? scale(selectedMarket?.visitors ?? period.inbound_visitors, previous.inbound_visitors / period.inbound_visitors)
    : undefined;

  const cityVisits = cities.reduce((sum, city) => sum + city.visitors, 0);
  const attractionAdmissions = attractions.reduce((sum, attraction) => sum + attraction.visitors, 0);
  const trend: TrendPoint[] = dataset.trend.map((item) => ({ ...item }));

  return {
    available: true,
    is_demo: true,
    country_code: country,
    country_name: dataset.country.name,
    year,
    quarter,
    period_key: periodKey,
    inbound_visitors: selectedInbound,
    inbound_total_visitors: period.inbound_visitors,
    outbound_visitors: period.outbound_visitors,
    city_visits: cityId === "all" ? period.city_visits : cityVisits,
    attraction_admissions: cityId === "all" ? period.attraction_admissions : attractionAdmissions,
    inbound_yoy_pct: selectedMarket
      ? growth(selectedInbound, selectedInboundPrevious)
      : growth(period.inbound_visitors, previous?.inbound_visitors),
    outbound_yoy_pct: growth(period.outbound_visitors, previous?.outbound_visitors),
    city_yoy_pct:
      cityId === "all"
        ? growth(period.city_visits, previous?.city_visits)
        : growth(cityVisits, previous ? scale(cityVisits, previous.city_visits / period.city_visits) : undefined),
    attraction_yoy_pct:
      cityId === "all"
        ? growth(period.attraction_admissions, previous?.attraction_admissions)
        : growth(
            attractionAdmissions,
            previous
              ? scale(attractionAdmissions, previous.attraction_admissions / period.attraction_admissions)
              : undefined,
          ),
    selected_market: marketCode,
    selected_city: cityId,
    markets: markets.sort((a, b) => b.visitors - a.visitors),
    cities,
    attractions,
    trend,
    source_label: dataset.source_label,
  };
}
