import hashlib
import re
import uuid
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

import httpx

from backend.app.models.ai_development import CategoryType, SourceType

OPENALEX_URL = "https://api.openalex.org/works"
GOV_CANADA_RSS_URL = "https://www.canada.ca/en/news/advanced-news-search/news-results.html?dprtmnt=departmentofindustry&typ=newsreleases&rss"
AI_KEYWORDS = {"ai", "artificial intelligence", "machine learning", "deep learning", "llm", "generative"}
CANADA_KEYWORDS = {
    "canada",
    "canadian",
    "ottawa",
    "quebec",
    "ontario",
    "alberta",
    "british columbia",
    "manitoba",
    "saskatchewan",
    "nova scotia",
    "new brunswick",
    "newfoundland",
    "pei",
}
CANADA_ENTITIES = {
    "government of canada",
    "ised",
    "cifar",
    "mila",
    "vector institute",
    "amii",
    "university of toronto",
    "university of alberta",
    "mcgill",
    "ubc",
}
PROVINCE_TOKENS = {
    "ontario": "Ontario",
    "toronto": "Ontario",
    "waterloo": "Ontario",
    "quebec": "Quebec",
    "montreal": "Quebec",
    "alberta": "Alberta",
    "edmonton": "Alberta",
    "calgary": "Alberta",
    "british columbia": "British Columbia",
    "vancouver": "British Columbia",
}


def _detect_language(value: str | None) -> str:
    if value in {"en", "fr"}:
        return value
    return "other"


def _contains_ai(text: str) -> bool:
    low = text.lower()
    return any(keyword in low for keyword in AI_KEYWORDS)


def _canada_relevance_score(*parts: str) -> float:
    blob = " ".join(parts).lower()
    score = 0.0

    if any(keyword in blob for keyword in CANADA_KEYWORDS):
        score += 0.35
    entity_hits = sum(1 for ent in CANADA_ENTITIES if ent in blob)
    score += min(entity_hits * 0.2, 0.4)
    if "government of canada" in blob or "canada.ca" in blob:
        score += 0.25
    if "openalex.org" in blob:
        score += 0.05

    return min(score, 1.0)


def _infer_jurisdiction(*parts: str) -> str:
    blob = " ".join(parts).lower()
    for token, province in PROVINCE_TOKENS.items():
        if token in blob:
            return province
    if "canada" in blob or "canadian" in blob:
        return "Canada"
    return "Global"


def _extract_tags(title: str) -> list[str]:
    tokenized = re.findall(r"[a-zA-Z]{4,}", title.lower())
    common = {"with", "from", "that", "this", "have", "into", "their", "about", "across", "opens"}
    unique: list[str] = []
    for token in tokenized:
        if token in common:
            continue
        if token not in unique:
            unique.append(token)
    return unique[:5] or ["ai"]


def _fingerprint(source_id: str, url: str, published_at: datetime) -> str:
    material = f"{source_id}|{url}|{published_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


async def fetch_openalex_metadata(limit: int = 3) -> list[dict[str, object]]:
    params = {"search": "artificial intelligence Canada", "per-page": str(limit), "sort": "publication_date:desc"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(OPENALEX_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    records: list[dict[str, object]] = []
    for result in payload.get("results", []):
        title = result.get("display_name") or ""
        if not title:
            continue
        if not _contains_ai(title):
            continue

        source_id = str(result.get("id", f"openalex-{uuid.uuid4().hex[:10]}"))
        published_raw = result.get("publication_date") or datetime.now(UTC).date().isoformat()
        published_at = datetime.fromisoformat(f"{published_raw}T00:00:00+00:00")
        primary_location = result.get("primary_location") or {}
        url = primary_location.get("landing_page_url") or f"https://openalex.org/{source_id}"
        language = _detect_language(result.get("language"))
        institutions = []
        for auth in result.get("authorships", []):
            for inst in auth.get("institutions", []):
                name = inst.get("display_name")
                if name and name not in institutions:
                    institutions.append(name)

        joined_entities = " ".join(institutions[:8])
        relevance = _canada_relevance_score(title, url, joined_entities)
        jurisdiction = _infer_jurisdiction(title, joined_entities)
        confidence = round(0.65 + (0.3 * relevance), 2)

        records.append(
            {
                "source_id": source_id,
                "source_type": SourceType.academic,
                "category": CategoryType.research,
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
        )
    return records


async def fetch_canada_gov_metadata(limit: int = 3) -> list[dict[str, object]]:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(GOV_CANADA_RSS_URL)
        response.raise_for_status()
        xml_text = response.text

    root = ET.fromstring(xml_text)
    items = root.findall(".//item")
    records: list[dict[str, object]] = []
    for item in items[:limit]:
        title = (item.findtext("title") or "").strip()
        if not title or not _contains_ai(title):
            continue

        link = (item.findtext("link") or "").strip()
        guid = (item.findtext("guid") or "").strip() or f"gc-{uuid.uuid4().hex[:12]}"
        pubdate_raw = (item.findtext("pubDate") or "").strip()
        try:
            published_at = parsedate_to_datetime(pubdate_raw).astimezone(UTC)
        except Exception:
            published_at = datetime.now(UTC)

        relevance = _canada_relevance_score(title, link, "Government of Canada ISED")
        records.append(
            {
                "source_id": guid,
                "source_type": SourceType.gov,
                "category": CategoryType.policy,
                "title": title,
                "url": link or "https://www.canada.ca/en/news.html",
                "publisher": "Government of Canada",
                "published_at": published_at,
                "language": "en",
                "jurisdiction": "Canada",
                "entities": ["Government of Canada", "ISED"],
                "tags": _extract_tags(title),
                "hash": _fingerprint(guid, link, published_at),
                "confidence": round(max(0.9, relevance), 2),
                "relevance_score": relevance,
            }
        )
    return records
