from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SourceDefinition:
    key: str
    display_name: str
    source_type: str
    acquisition_mode: str
    cadence_minutes: int
    enabled: bool = True


SOURCE_DEFINITIONS: tuple[SourceDefinition, ...] = (
    SourceDefinition(
        key="openalex",
        display_name="OpenAlex",
        source_type="academic",
        acquisition_mode="api",
        cadence_minutes=30,
    ),
    SourceDefinition(
        key="canada_gov_ised",
        display_name="Government of Canada (ISED)",
        source_type="gov",
        acquisition_mode="rss",
        cadence_minutes=30,
    ),
    SourceDefinition(
        key="betakit_ai",
        display_name="BetaKit AI",
        source_type="media",
        acquisition_mode="rss",
        cadence_minutes=30,
    ),
    SourceDefinition(
        key="google_news_canada_ai",
        display_name="Google News (Canada AI)",
        source_type="media",
        acquisition_mode="rss",
        cadence_minutes=45,
    ),
    SourceDefinition(
        key="github_ai_canada",
        display_name="GitHub (AI Canada)",
        source_type="repository",
        acquisition_mode="api",
        cadence_minutes=45,
    ),
    SourceDefinition(
        key="arxiv_ai_canada",
        display_name="arXiv (AI Canada)",
        source_type="academic",
        acquisition_mode="api",
        cadence_minutes=45,
    ),
    SourceDefinition(
        key="treasury_board_canada",
        display_name="Treasury Board of Canada",
        source_type="gov",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="opc_canada",
        display_name="Office of the Privacy Commissioner (Canada)",
        source_type="gov",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="crtc_canada",
        display_name="CRTC",
        source_type="gov",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="canada_gazette_ai",
        display_name="Canada Gazette (AI)",
        source_type="gov",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="pspc_procurement_ai",
        display_name="PSPC Procurement (AI)",
        source_type="industry",
        acquisition_mode="crawler",
        cadence_minutes=60,
        enabled=False,
    ),
    SourceDefinition(
        key="semantic_scholar_ai_canada",
        display_name="Semantic Scholar (AI Canada)",
        source_type="academic",
        acquisition_mode="api",
        cadence_minutes=45,
        enabled=False,
    ),
    SourceDefinition(
        key="crossref_ai_canada",
        display_name="Crossref (AI Canada)",
        source_type="academic",
        acquisition_mode="api",
        cadence_minutes=45,
        enabled=True,
    ),
    SourceDefinition(
        key="mila_news",
        display_name="Mila News",
        source_type="academic",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="vector_news",
        display_name="Vector Institute News",
        source_type="academic",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="amii_news",
        display_name="Amii News",
        source_type="academic",
        acquisition_mode="sitemap",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="cifar_ai",
        display_name="CIFAR AI",
        source_type="academic",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="nserc_ai",
        display_name="NSERC (AI Programs)",
        source_type="funding",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="cihr_ai",
        display_name="CIHR (AI Programs)",
        source_type="funding",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
    SourceDefinition(
        key="cfi_ai",
        display_name="CFI (AI Programs)",
        source_type="funding",
        acquisition_mode="rss",
        cadence_minutes=60,
        enabled=True,
    ),
)

SOURCE_DEFINITIONS_BY_KEY = {source.key: source for source in SOURCE_DEFINITIONS}


def list_source_definitions(*, include_disabled: bool = True) -> list[SourceDefinition]:
    if include_disabled:
        return list(SOURCE_DEFINITIONS)
    return [source for source in SOURCE_DEFINITIONS if source.enabled]


def get_source_definition(source_key: str) -> SourceDefinition | None:
    return SOURCE_DEFINITIONS_BY_KEY.get(source_key)



