"""create ai_developments

Revision ID: 20260212_0001
Revises:
Create Date: 2026-02-12 16:40:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260212_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    source_type_enum = sa.Enum("gov", "academic", "media", "industry", "funding", name="source_type_enum")
    category_enum = sa.Enum("policy", "research", "industry", "funding", "news", "incidents", name="category_enum")
    source_type_col_enum = postgresql.ENUM(
        "gov", "academic", "media", "industry", "funding", name="source_type_enum", create_type=False
    )
    category_col_enum = postgresql.ENUM(
        "policy", "research", "industry", "funding", "news", "incidents", name="category_enum", create_type=False
    )
    source_type_enum.create(op.get_bind(), checkfirst=True)
    category_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "ai_developments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", sa.String(length=255), nullable=False),
        sa.Column("source_type", source_type_col_enum, nullable=False),
        sa.Column("category", category_col_enum, nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("publisher", sa.String(length=255), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("language", sa.String(length=16), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=False),
        sa.Column("entities", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("hash", sa.String(length=128), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("hash"),
    )

    op.create_index("ix_ai_developments_source_id", "ai_developments", ["source_id"], unique=False)
    op.create_index("ix_ai_developments_source_type", "ai_developments", ["source_type"], unique=False)
    op.create_index("ix_ai_developments_category", "ai_developments", ["category"], unique=False)
    op.create_index("ix_ai_developments_publisher", "ai_developments", ["publisher"], unique=False)
    op.create_index("ix_ai_developments_published_at", "ai_developments", ["published_at"], unique=False)
    op.create_index("ix_ai_developments_ingested_at", "ai_developments", ["ingested_at"], unique=False)
    op.create_index("ix_ai_developments_language", "ai_developments", ["language"], unique=False)
    op.create_index("ix_ai_developments_jurisdiction", "ai_developments", ["jurisdiction"], unique=False)
    op.create_index("ix_ai_developments_hash", "ai_developments", ["hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_ai_developments_hash", table_name="ai_developments")
    op.drop_index("ix_ai_developments_jurisdiction", table_name="ai_developments")
    op.drop_index("ix_ai_developments_language", table_name="ai_developments")
    op.drop_index("ix_ai_developments_ingested_at", table_name="ai_developments")
    op.drop_index("ix_ai_developments_published_at", table_name="ai_developments")
    op.drop_index("ix_ai_developments_publisher", table_name="ai_developments")
    op.drop_index("ix_ai_developments_category", table_name="ai_developments")
    op.drop_index("ix_ai_developments_source_type", table_name="ai_developments")
    op.drop_index("ix_ai_developments_source_id", table_name="ai_developments")
    op.drop_table("ai_developments")

    sa.Enum(name="category_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="source_type_enum").drop(op.get_bind(), checkfirst=True)
