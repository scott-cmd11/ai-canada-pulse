from __future__ import annotations

import hashlib
from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

import httpx

from workers.app.source_adapters import (
    _canada_relevance_score,
    _contains_ai,
    _detect_language,
    _extract_tags,
    _infer_jurisdiction,
)

OPENALEX_URL = "https://api.openalex.org/works"


def month_windows(start: date, end: date) -> list[tuple[date, date]]:
    windows: list[tuple[date, date]] = []
    current = date(start.year, start.month, 1)
    while current <= end:
        if current.month == 12:
            next_month = date(current.year + 1, 1, 1)
        else:
            next_month = date(current.year, current.month + 1, 1)
        month_end = min(end, date(next_month.year, next_month.month, 1))
        windows.append((current, month_end))
        current = next_month
    return windows


def _fingerprint(source_id: str, url: str, published_at: datetime) -> str:
    material = f"{source_id}|{url}|{published_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def _to_record(result: dict[str, Any]) -> dict[str, Any] | None:
    title = result.get("display_name") or ""
    if not title or not _contains_ai(title):
        return None

    source_id = str(result.get("id", f"openalex-{uuid4().hex[:10]}"))
    published_raw = result.get("publication_date")
    if not published_raw:
        return None

    published_at = datetime.fromisoformat(f"{published_raw}T00:00:00+00:00")
    primary_location = result.get("primary_location") or {}
    url = primary_location.get("landing_page_url") or f"https://openalex.org/{source_id}"
    language = _detect_language(result.get("language"))

    institutions: list[str] = []
    has_canadian_institution = False
    for auth in result.get("authorships", []):
        for inst in auth.get("institutions", []):
            name = inst.get("display_name")
            if name and name not in institutions:
                institutions.append(name)
            if str(inst.get("country_code", "")).upper() == "CA":
                has_canadian_institution = True

    entities_blob = " ".join(institutions[:8])
    relevance = _canada_relevance_score(title, url, entities_blob)
    if has_canadian_institution:
        relevance = min(1.0, relevance + 0.35)
    confidence = round(0.62 + (0.35 * relevance), 2)
    jurisdiction = _infer_jurisdiction(title, entities_blob, "canada" if has_canadian_institution else "")

    return {
        "source_id": source_id,
        "source_type": "academic",
        "category": "research",
        "title": title,
        "url": url,
        "publisher": "OpenAlex",
        "published_at": published_at,
        "language": language,
        "jurisdiction": jurisdiction,
        "entities": institutions[:5],
        "tags": _extract_tags(title),
        "hash": _fingerprint(source_id, url, published_at),
        "confidence": confidence,
        "relevance_score": relevance,
    }


async def fetch_openalex_month(
    *,
    start_date: date,
    end_date: date,
    per_page: int = 100,
    max_pages: int = 5,
) -> list[dict[str, Any]]:
    params_base = {
        "filter": (
            f"from_publication_date:{start_date.isoformat()},"
            f"to_publication_date:{end_date.isoformat()},"
            "authorships.institutions.country_code:CA"
        ),
        "search": "artificial intelligence OR machine learning OR generative",
        "per-page": str(per_page),
        "sort": "publication_date:desc",
    }
    records: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=20.0) as client:
        for page in range(1, max_pages + 1):
            params = {**params_base, "page": str(page)}
            response = await client.get(OPENALEX_URL, params=params)
            response.raise_for_status()
            payload = response.json()
            results = payload.get("results", [])
            if not results:
                break
            for item in results:
                normalized = _to_record(item)
                if normalized:
                    records.append(normalized)
    return records
