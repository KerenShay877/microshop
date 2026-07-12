import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="pending", index=True)
    transaction_id = Column(String, nullable=True)
    idempotency_key = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
