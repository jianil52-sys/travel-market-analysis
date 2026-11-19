export interface TrendPoint {
  year: number;
  quarter: number;
  period_key: string;
  inbound_visitors: number;
  outbound_visitors: number;
  city_visits: number;
  attraction_admissions: number;
}

export interface MarketMetric {
  code: string;
  name: string;
  origin_market_type: "nationality" | "residence" | "source_market" | "region";
  visitors: number;
  share_pct: number;
}

export interface CityMetric {
  id: string;
  name: string;
  visitors: number;
  yoy_pct: number;
}

export interface AttractionMetric {
  id: string;
  name: string;
  city_id: string;
  city_name: string;
  category: string;
  visitors: number;
  yoy_pct: number;
}

export interface DashboardResponse {
  available: boolean;
  is_demo: boolean;
  country_code: string;
  country_name: string;
  year: number;
  quarter: number;
  period_key: string;
  inbound_visitors: number;
  inbound_total_visitors: number;
  outbound_visitors: number;
  city_visits: number;
  attraction_admissions: number;
  inbound_yoy_pct: number | null;
  outbound_yoy_pct: number | null;
  city_yoy_pct: number | null;
  attraction_yoy_pct: number | null;
  selected_market: string;
  selected_city: string;
  markets: MarketMetric[];
  cities: CityMetric[];
  attractions: AttractionMetric[];
  trend: TrendPoint[];
  source_label: string;
  message?: string;
}

export interface DemoDataset {
  country: {
    code: string;
    name: string;
    english_name: string;
  };
  base_period: string;
  base_metrics: {
    inbound_visitors: number;
    outbound_visitors: number;
    city_visits: number;
    attraction_admissions: number;
  };
  trend: TrendPoint[];
  markets: Array<{
    code: string;
    name: string;
    origin_market_type: "nationality" | "residence" | "source_market" | "region";
    visitors: number;
  }>;
  cities: CityMetric[];
  attractions: AttractionMetric[];
  source_label: string;
}
