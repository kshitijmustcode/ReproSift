"""Create versioned requirement document and chunk tables.

Revision ID: 20260919_02
Revises: 20260919_01
Create Date: 2026-09-19
"""

import sqlalchemy as sa
from alembic import op

revision = "20260919_02"
down_revision = "20260919_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "requirement_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_name", sa.String(length=256), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_name", "version"),
    )
    op.create_table(
        "requirement_chunks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("heading", sa.String(length=512), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"], ["requirement_documents.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "ordinal"),
    )
    op.create_index(
        "ix_requirement_chunks_document_id", "requirement_chunks", ["document_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_requirement_chunks_document_id", table_name="requirement_chunks")
    op.drop_table("requirement_chunks")
    op.drop_table("requirement_documents")
