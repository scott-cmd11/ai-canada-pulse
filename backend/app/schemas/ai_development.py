from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class FeedItem(BaseModel):
    id: UUID
    source_id: str
    source_type: str
    category: str
    title: str
    description: str = ""
    url: str
    publisher: str
    published_at: datetime
    ingested_at: datetime
    language: str
    jurisdiction: str
    entities: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    hash: str
    confidence: float


class FeedResponse(BaseModel):
    items: list[FeedItem]
    page: int
    page_size: int
    total: int


class KPIWindow(BaseModel):
    current: int
    previous: int
    delta_percent: float


class KPIsResponse(BaseModel):
    m15: KPIWindow
    h1: KPIWindow
    d7: KPIWindow


class EChartsSeries(BaseModel):
    name: str
    type: str
    stack: str | None = None
    areaStyle: dict[str, Any] | None = None
    emphasis: dict[str, Any] | None = None
    data: list[int]


class EChartsTimeseriesResponse(BaseModel):
    legend: list[str]
    xAxis: list[str]
    series: list[EChartsSeries]


class StatsAlertItem(BaseModel):
    category: str
    direction: str
    severity: str
    current: int
    previous: int
    delta_percent: float
    baseline_mean: float | None = None
    baseline_stddev: float | None = None
    z_score: float | None = None
    trigger_reason: str | None = None


class StatsAlertsResponse(BaseModel):
    generated_at: datetime
    time_window: str
    min_baseline: int
    min_delta_percent: float
    min_z_score: float
    lookback_windows: int
    alerts: list[StatsAlertItem]
