from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Query


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "demo-japan.json"
DATA: dict[str, Any] = json.loads(DATA_PATH.read_text(encoding="utf-8"))
BASE_PERIOD = next(
    point for point in DATA["trend"] if point["period_key"] == DATA["base_period"]
)

app = FastAPI(
    title="Travel Market Analysis API",
    version="0.1.0",
    description="旅行市场分析最小演示 API。当前仅提供日本模拟样本。",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "demo"}


def _growth(current: int, previous: int | None) -> float | None:
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


def _scale(value: int, ratio: float) -> int:
    return round(value * ratio)


def _empty_response(country_code: str, year: int, quarter: int, market_code: str, city_id: str) -> dict[str, Any]:
    country_name = DATA["country"]["name"] if country_code == DATA["country"]["code"] else country_code
    return {
        "available": False,
        "is_demo": True,
        "country_code": country_code,
        "country_name": country_name,
        "year": year,
        "quarter": quarter,
        "period_key": f"{year}-Q{quarter}",
        "inbound_visitors": 0,
        "inbound_total_visitors": 0,
        "outbound_visitors": 0,
        "city_visits": 0,
        "attraction_admissions": 0,
        "inbound_yoy_pct": None,
        "outbound_yoy_pct": None,
        "city_yoy_pct": None,
        "attraction_yoy_pct": None,
        "selected_market": market_code,
        "selected_city": city_id,
        "markets": [],
        "cities": [],
        "attractions": [],
        "trend": [],
        "source_label": DATA["source_label"],
        "message": (
            "当前最小演示仅包含日本。其他国家的数据接入后会在此展示。"
            if country_code != DATA["country"]["code"]
            else "所选季度暂无演示数据，请调整年份或季度。"
        ),
    }


def make_dashboard(
    country_code: str,
    year: int,
    quarter: int,
    market_code: str,
    city_id: str,
) -> dict[str, Any]:
    country_code = country_code.upper()
    market_code = market_code.upper()
    if country_code != DATA["country"]["code"]:
        return _empty_response(country_code, year, quarter, market_code, city_id)

    period = next(
        (point for point in DATA["trend"] if point["year"] == year and point["quarter"] == quarter),
        None,
    )
    if period is None:
        return _empty_response(country_code, year, quarter, market_code, city_id)

    inbound_ratio = period["inbound_visitors"] / BASE_PERIOD["inbound_visitors"]
    city_ratio = period["city_visits"] / BASE_PERIOD["city_visits"]
    attraction_ratio = period["attraction_admissions"] / BASE_PERIOD["attraction_admissions"]

    markets = []
    counted_visitors = 0
    raw_markets = DATA["markets"]
    for item in raw_markets[:-1]:
        visitors = _scale(item["visitors"], inbound_ratio)
        counted_visitors += visitors
        markets.append(
            {
                **item,
                "visitors": visitors,
                "share_pct": round(visitors / period["inbound_visitors"] * 100, 1),
            }
        )
    other = raw_markets[-1]
    other_visitors = max(0, period["inbound_visitors"] - counted_visitors)
    markets.append(
        {
            **other,
            "visitors": other_visitors,
            "share_pct": round(other_visitors / period["inbound_visitors"] * 100, 1),
        }
    )

    previous = next(
        (point for point in DATA["trend"] if point["year"] == year - 1 and point["quarter"] == quarter),
        None,
    )
    selected_market = next((item for item in markets if item["code"] == market_code), None)
    inbound_visitors = selected_market["visitors"] if selected_market else period["inbound_visitors"]
    inbound_previous = None
    if previous:
        inbound_previous = (
            _scale(inbound_visitors, previous["inbound_visitors"] / period["inbound_visitors"])
            if selected_market
            else previous["inbound_visitors"]
        )

    cities = [
        {**item, "visitors": _scale(item["visitors"], city_ratio)}
        for item in DATA["cities"]
        if city_id == "all" or item["id"] == city_id
    ]
    attractions = [
        {**item, "visitors": _scale(item["visitors"], attraction_ratio)}
        for item in DATA["attractions"]
        if city_id == "all" or item["city_id"] == city_id
    ]
    cities.sort(key=lambda item: item["visitors"], reverse=True)
    attractions.sort(key=lambda item: item["visitors"], reverse=True)

    city_visits = period["city_visits"] if city_id == "all" else sum(item["visitors"] for item in cities)
    attraction_admissions = (
        period["attraction_admissions"]
        if city_id == "all"
        else sum(item["visitors"] for item in attractions)
    )
    previous_city = previous["city_visits"] if previous else None
    previous_attractions = previous["attraction_admissions"] if previous else None
    if previous and city_id != "all":
        previous_city = _scale(city_visits, previous["city_visits"] / period["city_visits"])
        previous_attractions = _scale(
            attraction_admissions,
            previous["attraction_admissions"] / period["attraction_admissions"],
        )

    return {
        "available": True,
        "is_demo": True,
        "country_code": country_code,
        "country_name": DATA["country"]["name"],
        "year": year,
        "quarter": quarter,
        "period_key": period["period_key"],
        "inbound_visitors": inbound_visitors,
        "inbound_total_visitors": period["inbound_visitors"],
        "outbound_visitors": period["outbound_visitors"],
        "city_visits": city_visits,
        "attraction_admissions": attraction_admissions,
        "inbound_yoy_pct": _growth(inbound_visitors, inbound_previous),
        "outbound_yoy_pct": _growth(period["outbound_visitors"], previous["outbound_visitors"] if previous else None),
        "city_yoy_pct": _growth(city_visits, previous_city),
        "attraction_yoy_pct": _growth(attraction_admissions, previous_attractions),
        "selected_market": market_code,
        "selected_city": city_id,
        "markets": sorted(markets, key=lambda item: item["visitors"], reverse=True),
        "cities": cities,
        "attractions": attractions,
        "trend": DATA["trend"],
        "source_label": DATA["source_label"],
    }


@app.get("/api/v1/analytics/dashboard")
def get_dashboard(
    country_code: str = Query(default="JP", min_length=2, max_length=2),
    year: int = Query(default=2025, ge=2000, le=2100),
    quarter: int = Query(default=2, ge=1, le=4),
    market_code: str = Query(default="all", max_length=12),
    city_id: str = Query(default="all", max_length=32),
) -> dict[str, Any]:
    return make_dashboard(country_code, year, quarter, market_code, city_id)
