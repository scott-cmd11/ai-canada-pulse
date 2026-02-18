"""add source ingestion tracking tables

Revision ID: 20260216_0004
Revises: 20260214_0003
Create Date: 2026-02-16 17:20:00
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260216_0004"
down_revision: Union[str, None] = "20260214_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "source_states",
        sa.Column("source_key", sa.String(length=96), nullable=False),
        sa.Column("cursor", sa.Text(), nullable=True),
        sa.Column("etag", sa.String(length=512), nullable=True),
        sa.Column("last_modified", sa.String(length=128), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consecutive_failures", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("source_key"),
    )

    op.create_index("ix_source_states_last_success_at", "source_states", ["last_success_at"], unique=False)
    op.create_index("ix_source_states_last_error_at", "source_states", ["last_error_at"], unique=False)
    op.create_index("ix_source_states_next_run_at", "source_states", ["next_run_at"], unique=False)
    op.create_index("ix_source_states_updated_at", "source_states", ["updated_at"], unique=False)

    op.create_table(
        "source_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_key", sa.String(length=96), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fetched", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accepted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("inserted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicates", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("write_errors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error", sa.Text(), nullable=False, server_default=""),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_source_runs_source_key", "source_runs", ["source_key"], unique=False)
    op.create_index("ix_source_runs_status", "source_runs", ["status"], unique=False)
    op.create_index("ix_source_runs_started_at", "source_runs", ["started_at"], unique=False)
    op.create_index("ix_source_runs_finished_at", "source_runs", ["finished_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_source_runs_finished_at", table_name="source_runs")
    op.drop_index("ix_source_runs_started_at", table_name="source_runs")
    op.drop_index("ix_source_runs_status", table_name="source_runs")
    op.drop_index("ix_source_runs_source_key", table_name="source_runs")
    op.drop_table("source_runs")

    op.drop_index("ix_source_states_updated_at", table_name="source_states")
    op.drop_index("ix_source_states_next_run_at", table_name="source_states")
    op.drop_index("ix_source_states_last_error_at", table_name="source_states")
    op.drop_index("ix_source_states_last_success_at", table_name="source_states")
    op.drop_table("source_states")
