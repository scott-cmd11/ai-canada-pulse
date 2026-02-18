"""add repository to source_type_enum

Revision ID: 20260214_0003
Revises: 20260212_0002
Create Date: 2026-02-14 12:00:00
"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260214_0003"
down_revision: Union[str, None] = "20260212_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'repository';")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # A full migration would need to recreate the type, but this is rarely needed.
    pass
