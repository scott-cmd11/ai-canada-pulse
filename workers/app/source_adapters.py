import hashlib
import html
import re
import uuid
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

import httpx

from backend.app.models.ai_development import CategoryType, SourceType

OPENALEX_URL = "https://api.openalex.org/works"
GOV_CANADA_RSS_URL = "https://www.canada.ca/en/news/advanced-news-search/news-results.html?dprtmnt=departmentofindustry&typ=newsreleases&rss"
BETAKIT_AI_RSS_URL = "https://betakit.com/tag/artificial-intelligence/feed/"
GOOGLE_NEWS_CANADA_AI_RSS_URL = (
    "https://news.google.com/rss/search?q=artificial+intelligence+Canada&hl=en-CA&gl=CA&ceid=CA:en"
)
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


_FRENCH_MARKERS = {
    " des ", " dans ", " les ", " une ", " pour ", " sur ", " aux ",
    " est ", " par ", " avec ", " entre ", " cette ", " mais ",
    " politique", " gouvernement", " légalisation", " environnement",
    " société", " économi", " l'", " d'", " s'", " n'", " qu'",
}


def _likely_french(text: str) -> bool:
    """Heuristic: if ≥3 French marker words appear in the text, it's likely French."""
    low = f" {text.lower()} "
    hits = sum(1 for marker in _FRENCH_MARKERS if marker in low)
    return hits >= 3


def _detect_language(value: str | None, *, title: str = "") -> str:
    if _likely_french(title):
        return "fr"
    if value in {"en", "fr"}:
        return value
    return "other"


def _clamp_future_date(dt: datetime) -> datetime:
    """Cap publication dates to now — upstream APIs sometimes return speculative future dates."""
    now = datetime.now(UTC)
    return min(dt, now)



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


def _clean_text(value: str | None) -> str:
    return html.unescape((value or "").strip())


def _extract_publisher_from_title(title: str, fallback: str) -> str:
    # Google News RSS titles often end with " - Publisher".
    if " - " in title:
        candidate = title.rsplit(" - ", 1)[-1].strip()
        if candidate:
            return candidate
    return fallback


def _safe_parse_xml(xml_text: str) -> ET.Element | None:
    try:
        return ET.fromstring(xml_text)
    except ET.ParseError:
        return None


def _normalize_source_id(source_id: str, *, prefix: str) -> str:
    trimmed = source_id.strip()
    if len(trimmed) <= 240:
        return trimmed
    digest = hashlib.sha256(trimmed.encode("utf-8")).hexdigest()[:24]
    return f"{prefix}-{digest}"


def _fingerprint(source_id: str, url: str, published_at: datetime) -> str:
    material = f"{source_id}|{url}|{published_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


async def fetch_openalex_metadata(limit: int = 3) -> list[dict[str, object]]:
    params = {"search": "artificial intelligence Canada", "per-page": str(limit), "sort": "publication_date:desc"}
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(OPENALEX_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    records: list[dict[str, object]] = []
    for result in payload.get("results", []):
        title = _clean_text(result.get("display_name"))
        if not title:
            continue
        if not _contains_ai(title):
            continue

        source_id = _normalize_source_id(str(result.get("id", f"openalex-{uuid.uuid4().hex[:10]}")), prefix="openalex")
        published_raw = result.get("publication_date") or datetime.now(UTC).date().isoformat()
        published_at = _clamp_future_date(datetime.fromisoformat(f"{published_raw}T00:00:00+00:00"))
        primary_location = result.get("primary_location") or {}
        url = primary_location.get("landing_page_url") or f"https://openalex.org/{source_id}"
        language = _detect_language(result.get("language"), title=title)
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

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []
    items = root.findall(".//item")
    records: list[dict[str, object]] = []
    for item in items[:limit]:
        title = _clean_text(item.findtext("title"))
        if not title or not _contains_ai(title):
            continue

        link = (item.findtext("link") or "").strip()
        guid_raw = (item.findtext("guid") or "").strip() or f"gc-{uuid.uuid4().hex[:12]}"
        guid = _normalize_source_id(guid_raw, prefix="gc")
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


async def fetch_betakit_ai_metadata(limit: int = 5) -> list[dict[str, object]]:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(BETAKIT_AI_RSS_URL)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []
    items = root.findall(".//item")
    records: list[dict[str, object]] = []
    for item in items[:limit]:
        title = _clean_text(item.findtext("title"))
        if not title or not _contains_ai(title):
            continue

        link = _clean_text(item.findtext("link"))
        guid_raw = _clean_text(item.findtext("guid")) or f"betakit-{uuid.uuid4().hex[:12]}"
        guid = _normalize_source_id(guid_raw, prefix="betakit")
        pubdate_raw = _clean_text(item.findtext("pubDate"))
        try:
            published_at = parsedate_to_datetime(pubdate_raw).astimezone(UTC)
        except Exception:
            published_at = datetime.now(UTC)

        relevance = _canada_relevance_score(title, link, "BetaKit Canada")
        records.append(
            {
                "source_id": guid,
                "source_type": SourceType.media,
                "category": CategoryType.news,
                "title": title,
                "url": link or "https://betakit.com/",
                "publisher": "BetaKit",
                "published_at": published_at,
                "language": "en",
                "jurisdiction": "Canada",
                "entities": ["BetaKit"],
                "tags": _extract_tags(title),
                "hash": _fingerprint(guid, link, published_at),
                "confidence": round(max(0.82, relevance), 2),
                "relevance_score": relevance,
            }
        )
    return records


GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"
GITHUB_AI_CANADA_ORGS = ["maboroshi", "mila-iqia", "VectorInstitute", "CIFAR"]
ARXIV_API_URL = "http://export.arxiv.org/api/query"


async def fetch_github_ai_canada_metadata(limit: int = 10) -> list[dict[str, object]]:
    """Search GitHub for AI repositories with Canadian connections."""
    query = "artificial intelligence canada language:python sort:updated"
    params = {"q": query, "sort": "updated", "order": "desc", "per_page": str(min(limit, 30))}
    headers = {"Accept": "application/vnd.github+json"}

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(GITHUB_SEARCH_URL, params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()

    records: list[dict[str, object]] = []
    for repo in payload.get("items", [])[:limit]:
        name = repo.get("full_name", "")
        description = repo.get("description") or ""
        title = f"{name}: {description[:120]}" if description else name
        if not _contains_ai(title + " " + (repo.get("language") or "")):
            continue

        source_id = _normalize_source_id(f"github-{repo.get('id', uuid.uuid4().hex[:10])}", prefix="github")
        url = repo.get("html_url", f"https://github.com/{name}")
        pushed_at = repo.get("pushed_at") or repo.get("updated_at") or datetime.now(UTC).isoformat()
        try:
            published_at = _clamp_future_date(datetime.fromisoformat(pushed_at.replace("Z", "+00:00")))
        except Exception:
            published_at = datetime.now(UTC)

        owner = repo.get("owner", {}).get("login", "")
        topics = repo.get("topics", [])
        relevance = _canada_relevance_score(title, url, " ".join(topics) + " " + owner)
        jurisdiction = _infer_jurisdiction(title, " ".join(topics), owner)

        records.append(
            {
                "source_id": source_id,
                "source_type": SourceType.repository,
                "category": CategoryType.research,
                "title": title,
                "url": url,
                "publisher": f"GitHub/{owner}",
                "published_at": published_at,
                "language": "en",
                "jurisdiction": jurisdiction,
                "entities": [owner] + topics[:4],
                "tags": _extract_tags(title) + ["github"],
                "hash": _fingerprint(source_id, url, published_at),
                "confidence": round(max(0.5, min(0.95, 0.4 + (0.5 * relevance))), 2),
                "relevance_score": relevance,
            }
        )
    return records


async def fetch_arxiv_ai_canada_metadata(limit: int = 8) -> list[dict[str, object]]:
    """Search ArXiv for recent AI papers with Canadian affiliations."""
    query = "all:artificial intelligence AND all:Canada"
    params = {
        "search_query": query,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": str(min(limit, 30)),
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(ARXIV_API_URL, params=params)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    entries = root.findall("atom:entry", ns)

    records: list[dict[str, object]] = []
    for entry in entries[:limit]:
        title = _clean_text(entry.findtext("atom:title", "", ns)).replace("\n", " ").strip()
        if not title or not _contains_ai(title):
            continue

        arxiv_id = (entry.findtext("atom:id", "", ns) or "").strip()
        source_id = _normalize_source_id(arxiv_id or f"arxiv-{uuid.uuid4().hex[:12]}", prefix="arxiv")
        url = arxiv_id if arxiv_id.startswith("http") else f"https://arxiv.org/abs/{arxiv_id}"

        published_raw = (entry.findtext("atom:published", "", ns) or "").strip()
        try:
            published_at = _clamp_future_date(datetime.fromisoformat(published_raw.replace("Z", "+00:00")))
        except Exception:
            published_at = datetime.now(UTC)

        authors = []
        for author_elem in entry.findall("atom:author", ns):
            author_name = author_elem.findtext("atom:name", "", ns).strip()
            if author_name:
                authors.append(author_name)

        summary = _clean_text(entry.findtext("atom:summary", "", ns))[:200]
        relevance = _canada_relevance_score(title, summary, " ".join(authors[:5]))
        jurisdiction = _infer_jurisdiction(title, summary, " ".join(authors[:5]))

        records.append(
            {
                "source_id": source_id,
                "source_type": SourceType.academic,
                "category": CategoryType.research,
                "title": title,
                "url": url,
                "publisher": "ArXiv",
                "published_at": published_at,
                "language": "en",
                "jurisdiction": jurisdiction,
                "entities": authors[:5],
                "tags": _extract_tags(title) + ["arxiv", "preprint"],
                "hash": _fingerprint(source_id, url, published_at),
                "confidence": round(max(0.6, min(0.95, 0.5 + (0.4 * relevance))), 2),
                "relevance_score": relevance,
            }
        )
    return records


async def fetch_google_news_canada_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(GOOGLE_NEWS_CANADA_AI_RSS_URL)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []
    items = root.findall(".//item")
    records: list[dict[str, object]] = []
    for item in items[:limit]:
        raw_title = _clean_text(item.findtext("title"))
        if not raw_title:
            continue
        if not _contains_ai(raw_title):
            continue

        link = _clean_text(item.findtext("link"))
        guid_raw = _clean_text(item.findtext("guid")) or f"google-news-{uuid.uuid4().hex[:12]}"
        guid = _normalize_source_id(guid_raw, prefix="google-news")
        pubdate_raw = _clean_text(item.findtext("pubDate"))
        try:
            published_at = parsedate_to_datetime(pubdate_raw).astimezone(UTC)
        except Exception:
            published_at = datetime.now(UTC)

        publisher = _extract_publisher_from_title(raw_title, "Google News")
        title = raw_title.rsplit(" - ", 1)[0].strip() if " - " in raw_title else raw_title
        relevance = _canada_relevance_score(title, link, publisher)
        jurisdiction = _infer_jurisdiction(title, publisher, "Canada")
        confidence = round(max(0.84, min(0.99, 0.55 + (0.5 * relevance))), 2)

        records.append(
            {
                "source_id": guid,
                "source_type": SourceType.media,
                "category": CategoryType.news,
                "title": title,
                "url": link or "https://news.google.com/",
                "publisher": publisher,
                "published_at": published_at,
                "language": "en",
                "jurisdiction": jurisdiction if jurisdiction != "Global" else "Canada",
                "entities": [publisher],
                "tags": _extract_tags(title),
                "hash": _fingerprint(guid, link, published_at),
                "confidence": confidence,
                "relevance_score": relevance,
            }
        )
    return records

TREASURY_BOARD_CANADA_RSS_URL = "https://www.canada.ca/en/treasury-board-secretariat/news/news-releases.rss"
OPC_CANADA_RSS_URL = "https://www.priv.gc.ca/en/rss/news/"
CRTC_CANADA_RSS_URL = "https://crtc.gc.ca/eng/rss/news.xml"
CANADA_GAZETTE_P1_RSS_URL = "https://www.gazette.gc.ca/rss/p1-eng.xml"
CANADA_GAZETTE_P2_RSS_URL = "https://www.gazette.gc.ca/rss/p2-eng.xml"
CANADA_GAZETTE_P3_RSS_URL = "https://www.gazette.gc.ca/rss/en-ls-eng.xml"
MILA_NEWS_RSS_URL = "https://mila.quebec/en/feed/"
VECTOR_NEWS_RSS_URL = "https://vectorinstitute.ai/feed/"
AMII_SITEMAP_URL = "https://www.amii.ca/sitemap.xml"
CIFAR_AI_RSS_URL = "https://cifar.ca/feed/"
CANADA_GAZETTE_FEED_URLS = (CANADA_GAZETTE_P1_RSS_URL, CANADA_GAZETTE_P2_RSS_URL, CANADA_GAZETTE_P3_RSS_URL)
FEED_REQUEST_HEADERS = {
    "User-Agent": "AI-Canada-Pulse/1.0 (+https://localhost)",
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
}


def _parse_published_at_from_text(raw_value: str) -> datetime:
    value = _clean_text(raw_value)
    if not value:
        return datetime.now(UTC)

    try:
        if "T" in value:
            return _clamp_future_date(datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC))
    except Exception:
        pass

    try:
        return _clamp_future_date(parsedate_to_datetime(value).astimezone(UTC))
    except Exception:
        return datetime.now(UTC)


def _rss_item_to_record(
    item: ET.Element,
    *,
    feed_url: str,
    publisher: str,
    source_type: SourceType,
    category: CategoryType,
    source_prefix: str,
    entities: list[str],
    default_jurisdiction: str,
    force_language: str,
) -> dict[str, object] | None:
    title = _clean_text(item.findtext("title"))
    description = _clean_text(item.findtext("description"))
    if not title:
        return None

    content_blob = " ".join([title, description, publisher, " ".join(entities)])
    if not _contains_ai(content_blob):
        return None

    link = _clean_text(item.findtext("link"))
    guid_raw = _clean_text(item.findtext("guid")) or link or f"{source_prefix}-{uuid.uuid4().hex[:12]}"
    source_id = _normalize_source_id(guid_raw, prefix=source_prefix)
    published_at = _parse_published_at_from_text(item.findtext("pubDate") or item.findtext("published") or "")

    relevance = _canada_relevance_score(title, description, link, publisher, " ".join(entities), default_jurisdiction)
    jurisdiction = _infer_jurisdiction(title, description, publisher, " ".join(entities), default_jurisdiction)
    if jurisdiction == "Global":
        jurisdiction = default_jurisdiction

    confidence_floor = 0.84 if source_type == SourceType.gov else 0.78
    confidence = round(max(confidence_floor, min(0.98, 0.52 + (0.5 * relevance))), 2)

    return {
        "source_id": source_id,
        "source_type": source_type,
        "category": category,
        "title": title,
        "url": link or feed_url,
        "publisher": publisher,
        "published_at": published_at,
        "language": force_language,
        "jurisdiction": jurisdiction,
        "entities": entities,
        "tags": _extract_tags(title),
        "hash": _fingerprint(source_id, link or feed_url, published_at),
        "confidence": confidence,
        "relevance_score": relevance,
    }


def _atom_entry_to_record(
    entry: ET.Element,
    *,
    feed_url: str,
    publisher: str,
    source_type: SourceType,
    category: CategoryType,
    source_prefix: str,
    entities: list[str],
    default_jurisdiction: str,
    force_language: str,
) -> dict[str, object] | None:
    ns = "{http://www.w3.org/2005/Atom}"
    title = _clean_text(entry.findtext(f"{ns}title"))
    summary = _clean_text(entry.findtext(f"{ns}summary")) or _clean_text(entry.findtext(f"{ns}content"))
    if not title:
        return None

    content_blob = " ".join([title, summary, publisher, " ".join(entities)])
    if not _contains_ai(content_blob):
        return None

    link = ""
    link_elem = entry.find(f"{ns}link")
    if link_elem is not None:
        link = _clean_text(link_elem.attrib.get("href"))

    entry_id = _clean_text(entry.findtext(f"{ns}id")) or link or f"{source_prefix}-{uuid.uuid4().hex[:12]}"
    source_id = _normalize_source_id(entry_id, prefix=source_prefix)
    published_at = _parse_published_at_from_text(
        entry.findtext(f"{ns}published") or entry.findtext(f"{ns}updated") or ""
    )

    relevance = _canada_relevance_score(title, summary, link, publisher, " ".join(entities), default_jurisdiction)
    jurisdiction = _infer_jurisdiction(title, summary, publisher, " ".join(entities), default_jurisdiction)
    if jurisdiction == "Global":
        jurisdiction = default_jurisdiction

    confidence_floor = 0.84 if source_type == SourceType.gov else 0.78
    confidence = round(max(confidence_floor, min(0.98, 0.52 + (0.5 * relevance))), 2)

    return {
        "source_id": source_id,
        "source_type": source_type,
        "category": category,
        "title": title,
        "url": link or feed_url,
        "publisher": publisher,
        "published_at": published_at,
        "language": force_language,
        "jurisdiction": jurisdiction,
        "entities": entities,
        "tags": _extract_tags(title),
        "hash": _fingerprint(source_id, link or feed_url, published_at),
        "confidence": confidence,
        "relevance_score": relevance,
    }


async def _fetch_canadian_feed_metadata(
    *,
    feed_url: str,
    publisher: str,
    source_type: SourceType,
    category: CategoryType,
    source_prefix: str,
    entities: list[str],
    default_jurisdiction: str,
    force_language: str = "en",
    limit: int = 6,
    headers: dict[str, str] | None = None,
    verify: bool = True,
) -> list[dict[str, object]]:
    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        headers=headers or FEED_REQUEST_HEADERS,
        verify=verify,
    ) as client:
        response = await client.get(feed_url)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []

    records: list[dict[str, object]] = []
    rss_items = root.findall(".//item")
    if rss_items:
        for item in rss_items[:limit]:
            record = _rss_item_to_record(
                item,
                feed_url=feed_url,
                publisher=publisher,
                source_type=source_type,
                category=category,
                source_prefix=source_prefix,
                entities=entities,
                default_jurisdiction=default_jurisdiction,
                force_language=force_language,
            )
            if record:
                records.append(record)
        return records

    atom_entries = root.findall("{http://www.w3.org/2005/Atom}entry")
    for entry in atom_entries[:limit]:
        record = _atom_entry_to_record(
            entry,
            feed_url=feed_url,
            publisher=publisher,
            source_type=source_type,
            category=category,
            source_prefix=source_prefix,
            entities=entities,
            default_jurisdiction=default_jurisdiction,
            force_language=force_language,
        )
        if record:
            records.append(record)
    return records


async def fetch_treasury_board_canada_metadata(limit: int = 6) -> list[dict[str, object]]:
    return await _fetch_canadian_feed_metadata(
        feed_url=TREASURY_BOARD_CANADA_RSS_URL,
        publisher="Treasury Board of Canada Secretariat",
        source_type=SourceType.gov,
        category=CategoryType.policy,
        source_prefix="tbs",
        entities=["Treasury Board of Canada Secretariat", "Government of Canada"],
        default_jurisdiction="Canada",
        limit=limit,
    )


async def fetch_opc_canada_metadata(limit: int = 6) -> list[dict[str, object]]:
    return await _fetch_canadian_feed_metadata(
        feed_url=OPC_CANADA_RSS_URL,
        publisher="Office of the Privacy Commissioner of Canada",
        source_type=SourceType.gov,
        category=CategoryType.policy,
        source_prefix="opc",
        entities=["Office of the Privacy Commissioner of Canada", "Government of Canada"],
        default_jurisdiction="Canada",
        limit=limit,
    )


async def fetch_mila_news_metadata(limit: int = 8) -> list[dict[str, object]]:
    return await _fetch_canadian_feed_metadata(
        feed_url=MILA_NEWS_RSS_URL,
        publisher="Mila",
        source_type=SourceType.academic,
        category=CategoryType.research,
        source_prefix="mila",
        entities=["Mila", "Quebec", "Montreal"],
        default_jurisdiction="Quebec",
        limit=limit,
    )


async def fetch_vector_news_metadata(limit: int = 8) -> list[dict[str, object]]:
    return await _fetch_canadian_feed_metadata(
        feed_url=VECTOR_NEWS_RSS_URL,
        publisher="Vector Institute",
        source_type=SourceType.academic,
        category=CategoryType.research,
        source_prefix="vector",
        entities=["Vector Institute", "Ontario", "Toronto"],
        default_jurisdiction="Ontario",
        limit=limit,
    )



async def fetch_amii_news_metadata(limit: int = 8) -> list[dict[str, object]]:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=FEED_REQUEST_HEADERS) as client:
        response = await client.get(AMII_SITEMAP_URL)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []

    sitemap_ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    candidates: list[tuple[str, str]] = []
    for url_entry in root.findall(f"{sitemap_ns}url"):
        loc = _clean_text(url_entry.findtext(f"{sitemap_ns}loc"))
        if "/updates-insights/" not in loc:
            continue
        normalized_loc = loc.rstrip("/")
        if normalized_loc.endswith("/updates-insights"):
            continue
        lastmod = _clean_text(url_entry.findtext(f"{sitemap_ns}lastmod"))
        candidates.append((loc, lastmod))

    candidates.sort(key=lambda value: _parse_published_at_from_text(value[1]), reverse=True)
    records: list[dict[str, object]] = []
    scan_limit = max(limit * 6, 60)
    for loc, lastmod in candidates[:scan_limit]:
        slug = loc.rstrip("/").split("/")[-1]
        if not slug:
            continue
        title = re.sub(r"[-_]+", " ", slug).strip()
        title = re.sub(r"\s+", " ", title)
        if not title:
            continue

        source_id = _normalize_source_id(f"amii-{slug}", prefix="amii")
        published_at = _parse_published_at_from_text(lastmod)
        relevance = _canada_relevance_score(title, loc, "Amii Alberta Canada artificial intelligence")
        confidence = round(max(0.82, min(0.97, 0.56 + (0.45 * relevance))), 2)
        records.append(
            {
                "source_id": source_id,
                "source_type": SourceType.academic,
                "category": CategoryType.research,
                "title": title,
                "url": loc,
                "publisher": "Amii",
                "published_at": published_at,
                "language": "en",
                "jurisdiction": "Alberta",
                "entities": ["Amii", "Alberta", "Canada"],
                "tags": _extract_tags(title),
                "hash": _fingerprint(source_id, loc, published_at),
                "confidence": confidence,
                "relevance_score": relevance,
            }
        )
        if len(records) >= limit:
            break
    return records


async def fetch_cifar_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    records = await _fetch_canadian_feed_metadata(
        feed_url=CIFAR_AI_RSS_URL,
        publisher="CIFAR",
        source_type=SourceType.academic,
        category=CategoryType.research,
        source_prefix="cifar",
        entities=["CIFAR", "Canada"],
        default_jurisdiction="Canada",
        limit=max(limit * 4, 24),
    )
    for record in records:
        record["confidence"] = round(max(float(record.get("confidence", 0.0)), 0.84), 2)
        record["relevance_score"] = max(float(record.get("relevance_score", 0.0)), 0.5)
        if record.get("jurisdiction") in {"", "Global"}:
            record["jurisdiction"] = "Canada"
    return records


NSERC_AI_RSS_URL = "https://news.google.com/rss/search?q=NSERC+artificial+intelligence+Canada+funding&hl=en-CA&gl=CA&ceid=CA:en"
CIHR_AI_RSS_URL = "https://news.google.com/rss/search?q=CIHR+artificial+intelligence+Canada+funding&hl=en-CA&gl=CA&ceid=CA:en"
CFI_AI_RSS_URL = "https://news.google.com/rss/search?q=Canada+Foundation+for+Innovation+artificial+intelligence+Canada&hl=en-CA&gl=CA&ceid=CA:en"
CROSSREF_WORKS_API_URL = "https://api.crossref.org/works"


def _source_record_age_days(record: dict[str, object]) -> int | None:
    published_at = record.get("published_at")
    if not isinstance(published_at, datetime):
        return None
    now_utc = datetime.now(UTC)
    published_utc = published_at.astimezone(UTC)
    return max(0, int((now_utc - published_utc).total_seconds() // 86400))


def _apply_policy_recency_boost(record: dict[str, object]) -> None:
    age_days = _source_record_age_days(record)
    confidence = float(record.get("confidence", 0.0))
    relevance = float(record.get("relevance_score", 0.0))

    if age_days is not None:
        if age_days <= 14:
            confidence += 0.09
            relevance += 0.14
        elif age_days <= 45:
            confidence += 0.06
            relevance += 0.1
        elif age_days <= 120:
            confidence += 0.03
            relevance += 0.06

    record["confidence"] = round(min(0.99, max(confidence, 0.84)), 2)
    record["relevance_score"] = round(min(1.0, max(relevance, 0.45)), 2)


def _sort_records_latest(records: list[dict[str, object]]) -> list[dict[str, object]]:
    return sorted(records, key=lambda r: r.get("published_at") or datetime.now(UTC), reverse=True)


async def _fetch_google_news_topic_metadata(
    *,
    feed_url: str,
    source_prefix: str,
    source_type: SourceType,
    category: CategoryType,
    default_publisher: str,
    entity_hints: list[str],
    default_jurisdiction: str,
    limit: int = 8,
) -> list[dict[str, object]]:
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=FEED_REQUEST_HEADERS) as client:
        response = await client.get(feed_url)
        response.raise_for_status()
        xml_text = response.text

    root = _safe_parse_xml(xml_text)
    if root is None:
        return []

    records: list[dict[str, object]] = []
    scan_limit = max(limit * 4, 24)
    items = root.findall(".//item")
    for item in items[:scan_limit]:
        raw_title = _clean_text(item.findtext("title"))
        if not raw_title:
            continue
        if not _contains_ai(raw_title):
            continue

        link = _clean_text(item.findtext("link"))
        guid_raw = _clean_text(item.findtext("guid")) or link or f"{source_prefix}-{uuid.uuid4().hex[:12]}"
        source_id = _normalize_source_id(guid_raw, prefix=source_prefix)
        published_at = _parse_published_at_from_text(_clean_text(item.findtext("pubDate")))

        publisher = _extract_publisher_from_title(raw_title, default_publisher)
        title = raw_title.rsplit(" - ", 1)[0].strip() if " - " in raw_title else raw_title
        entities = [publisher] + [ent for ent in entity_hints if ent != publisher]
        entities = entities[:5]

        relevance = _canada_relevance_score(title, link, default_publisher, publisher, " ".join(entities))
        jurisdiction = _infer_jurisdiction(title, publisher, default_jurisdiction)
        if jurisdiction == "Global":
            jurisdiction = default_jurisdiction

        confidence = round(max(0.84, min(0.99, 0.56 + (0.44 * relevance))), 2)
        records.append(
            {
                "source_id": source_id,
                "source_type": source_type,
                "category": category,
                "title": title,
                "url": link or feed_url,
                "publisher": publisher,
                "published_at": published_at,
                "language": "en",
                "jurisdiction": jurisdiction,
                "entities": entities,
                "tags": _extract_tags(title),
                "hash": _fingerprint(source_id, link or feed_url, published_at),
                "confidence": confidence,
                "relevance_score": relevance,
            }
        )

    deduped: dict[str, dict[str, object]] = {}
    for record in _sort_records_latest(records):
        dedupe_key = str(record.get("source_id") or record.get("url") or "")
        if dedupe_key and dedupe_key not in deduped:
            deduped[dedupe_key] = record

    return list(deduped.values())[:limit]


def _crossref_item_datetime(item: dict[str, object]) -> datetime:
    for date_key in ("published-online", "published-print", "issued", "created"):
        value = item.get(date_key)
        if not isinstance(value, dict):
            continue
        parts = value.get("date-parts")
        if not parts or not isinstance(parts, list) or not parts[0]:
            continue
        part = parts[0]
        if not isinstance(part, list) or not part:
            continue
        year = int(part[0])
        month = int(part[1]) if len(part) > 1 else 1
        day = int(part[2]) if len(part) > 2 else 1
        try:
            return datetime(year, month, day, tzinfo=UTC)
        except Exception:
            continue
    return datetime.now(UTC)


def _crossref_authors(item: dict[str, object]) -> list[str]:
    authors: list[str] = []
    for author in item.get("author", []) or []:
        if not isinstance(author, dict):
            continue
        given = _clean_text(author.get("given"))
        family = _clean_text(author.get("family"))
        name = " ".join(part for part in [given, family] if part).strip()
        if name:
            authors.append(name)
    return authors[:6]


async def fetch_nserc_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    return await _fetch_google_news_topic_metadata(
        feed_url=NSERC_AI_RSS_URL,
        source_prefix="nserc",
        source_type=SourceType.funding,
        category=CategoryType.funding,
        default_publisher="NSERC",
        entity_hints=["NSERC", "Government of Canada", "Canada"],
        default_jurisdiction="Canada",
        limit=limit,
    )


async def fetch_cihr_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    return await _fetch_google_news_topic_metadata(
        feed_url=CIHR_AI_RSS_URL,
        source_prefix="cihr",
        source_type=SourceType.funding,
        category=CategoryType.funding,
        default_publisher="CIHR",
        entity_hints=["CIHR", "Government of Canada", "Canada"],
        default_jurisdiction="Canada",
        limit=limit,
    )


async def fetch_cfi_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    return await _fetch_google_news_topic_metadata(
        feed_url=CFI_AI_RSS_URL,
        source_prefix="cfi",
        source_type=SourceType.funding,
        category=CategoryType.funding,
        default_publisher="CFI",
        entity_hints=["CFI", "Canada Foundation for Innovation", "Canada"],
        default_jurisdiction="Canada",
        limit=limit,
    )


async def fetch_crossref_ai_canada_metadata(limit: int = 10) -> list[dict[str, object]]:
    params = {
        "query.title": "artificial intelligence Canada",
        "query": "Canada AI machine learning",
        "rows": str(min(max(limit * 6, 40), 100)),
        "sort": "published",
        "order": "desc",
        "filter": "from-pub-date:2023-01-01,type:journal-article",
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=FEED_REQUEST_HEADERS) as client:
        response = await client.get(CROSSREF_WORKS_API_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    records: list[dict[str, object]] = []
    for item in payload.get("message", {}).get("items", []):
        if not isinstance(item, dict):
            continue

        title_values = item.get("title") or []
        title = _clean_text(title_values[0] if title_values else "")
        if not title:
            continue

        publisher = _clean_text(item.get("publisher")) or "Crossref"
        container_values = item.get("container-title") or []
        venue = _clean_text(container_values[0] if container_values else "")
        authors = _crossref_authors(item)
        description_blob = " ".join(part for part in [title, venue, publisher, " ".join(authors)] if part)
        if not _contains_ai(description_blob):
            continue

        doi = _clean_text(item.get("DOI"))
        url = _clean_text(item.get("URL"))
        if not url and doi:
            url = f"https://doi.org/{doi}"
        if not url:
            continue

        published_at = _crossref_item_datetime(item)
        source_id = _normalize_source_id(f"crossref-{doi or uuid.uuid4().hex[:12]}", prefix="crossref")

        relevance = _canada_relevance_score(title, venue, publisher, " ".join(authors), "Canada")
        jurisdiction = _infer_jurisdiction(title, venue, publisher, " ".join(authors), "Canada")
        if jurisdiction == "Global":
            jurisdiction = "Canada"

        confidence = round(max(0.82, min(0.98, 0.58 + (0.4 * relevance))), 2)
        entities = [publisher] + authors[:3]

        records.append(
            {
                "source_id": source_id,
                "source_type": SourceType.academic,
                "category": CategoryType.research,
                "title": title,
                "url": url,
                "publisher": publisher,
                "published_at": published_at,
                "language": "en",
                "jurisdiction": jurisdiction,
                "entities": entities,
                "tags": _extract_tags(title) + ["crossref"],
                "hash": _fingerprint(source_id, url, published_at),
                "confidence": confidence,
                "relevance_score": relevance,
            }
        )

    deduped: dict[str, dict[str, object]] = {}
    for record in _sort_records_latest(records):
        dedupe_key = str(record.get("source_id") or record.get("url") or "")
        if dedupe_key and dedupe_key not in deduped:
            deduped[dedupe_key] = record

    return list(deduped.values())[:limit]


async def fetch_crtc_canada_metadata(limit: int = 6) -> list[dict[str, object]]:
    records = await _fetch_canadian_feed_metadata(
        feed_url=CRTC_CANADA_RSS_URL,
        publisher="CRTC",
        source_type=SourceType.gov,
        category=CategoryType.policy,
        source_prefix="crtc",
        entities=["CRTC", "Government of Canada", "Telecommunications"],
        default_jurisdiction="Canada",
        limit=max(limit * 12, 72),
        verify=False,
    )

    tuned: list[dict[str, object]] = []
    for record in records:
        age_days = _source_record_age_days(record)
        if age_days is not None and age_days > 540:
            continue
        _apply_policy_recency_boost(record)
        tags = [str(tag) for tag in record.get("tags", [])]
        if "crtc" not in tags:
            tags.append("crtc")
        record["tags"] = tags
        tuned.append(record)

    return _sort_records_latest(tuned)[: max(limit * 2, 12)]


async def fetch_canada_gazette_ai_metadata(limit: int = 8) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for feed_url in CANADA_GAZETTE_FEED_URLS:
        records.extend(
            await _fetch_canadian_feed_metadata(
                feed_url=feed_url,
                publisher="Canada Gazette",
                source_type=SourceType.gov,
                category=CategoryType.policy,
                source_prefix="gazette",
                entities=["Canada Gazette", "Government of Canada"],
                default_jurisdiction="Canada",
                limit=max(limit * 12, 96),
            )
        )

    deduped_by_key: dict[str, dict[str, object]] = {}
    for record in _sort_records_latest(records):
        dedupe_key = str(record.get("source_id") or record.get("url") or record.get("title") or "")
        if dedupe_key and dedupe_key not in deduped_by_key:
            deduped_by_key[dedupe_key] = record

    tuned: list[dict[str, object]] = []
    for record in deduped_by_key.values():
        age_days = _source_record_age_days(record)
        if age_days is not None and age_days > 540:
            continue
        _apply_policy_recency_boost(record)
        tags = [str(tag) for tag in record.get("tags", [])]
        if "gazette" not in tags:
            tags.append("gazette")
        record["tags"] = tags
        tuned.append(record)

    return _sort_records_latest(tuned)[: max(limit * 3, 24)]
