"""add materialized stats views

Revision ID: 20260212_0002
Revises: 20260212_0001
Create Date: 2026-02-12 22:10:00
"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260212_0002"
down_revision: Union[str, None] = "20260212_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_stats AS
        SELECT
          date_trunc('hour', published_at) AS bucket,
          category::text AS category,
          jurisdiction,
          COUNT(*)::int AS item_count
        FROM ai_developments
        WHERE published_at >= NOW() - INTERVAL '24 hours'
        GROUP BY 1, 2, 3
        ORDER BY 1;
        """
    )
    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_stats AS
        SELECT
          date_trunc('week', published_at) AS bucket,
          category::text AS category,
          COUNT(*)::int AS item_count
        FROM ai_developments
        WHERE published_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY 1, 2
        ORDER BY 1;
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_hourly_stats_bucket ON hourly_stats (bucket);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_hourly_stats_category ON hourly_stats (category);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_hourly_stats_jurisdiction ON hourly_stats (jurisdiction);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_weekly_stats_bucket ON weekly_stats (bucket);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_weekly_stats_category ON weekly_stats (category);")


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS weekly_stats;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS hourly_stats;")
