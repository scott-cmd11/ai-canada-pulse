import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, Float, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base


class SourceType(str, Enum):
    gov = "gov"
    academic = "academic"
    media = "media"
    industry = "industry"
    funding = "funding"
    repository = "repository"


class CategoryType(str, Enum):
    policy = "policy"
    research = "research"
    industry = "industry"
    funding = "funding"
    news = "news"
    incidents = "incidents"


class AIDevelopment(Base):
    __tablename__ = "ai_developments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_type: Mapped[SourceType] = mapped_column(SQLEnum(SourceType, name="source_type_enum"), nullable=False, index=True)
    category: Mapped[CategoryType] = mapped_column(SQLEnum(CategoryType, name="category_enum"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="other", index=True)
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    entities: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
