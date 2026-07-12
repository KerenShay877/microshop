"""Create payments table

Revision ID: 001
Revises:
Create Date: 2026-07-11

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("transaction_id", sa.String(), nullable=True),
        sa.Column("idempotency_key", sa.String(), nullable=True, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_order_id"), "payments", ["order_id"])
    op.create_index(op.f("ix_payments_status"), "payments", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_status"), table_name="payments")
    op.drop_index(op.f("ix_payments_order_id"), table_name="payments")
    op.drop_table("payments")
