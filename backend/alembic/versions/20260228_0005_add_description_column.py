"""add description column to ai_developments

Revision ID: 20260228_0005
Revises: 20260216_0004
Create Date: 2026-02-28 14:28:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260228_0005"
down_revision: Union[str, None] = "20260216_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_developments",
        sa.Column("description", sa.Text(), nullable=True, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("ai_developments", "description")
