import os
import pytest
from unittest.mock import patch, AsyncMock
from sqlalchemy import select

os.environ["PAYMENT_FAILURE_RATE"] = "0.0"

from app.database import async_session as real_async_session
from app.models import Payment
from app.events import process_payment, refund_payment


@pytest.fixture
def mock_publish():
    with patch("app.events.publish_event", new_callable=AsyncMock) as mock:
        yield mock


async def test_process_payment_creates_completed_payment(session, mock_publish):
    data = {"orderId": "order-1", "totalAmount": 99.99}

    with patch("app.events.async_session", return_value=session):

        async def mock_session_ctx():
            yield session

        mock_ctx = mock_session_ctx()
        original = session

        with patch("app.events.async_session") as mock_async_session:
            mock_async_session.return_value.__aenter__.return_value = original

            await process_payment(data)

    mock_publish.assert_called_once()
    call_args = mock_publish.call_args
    assert call_args[0][0] == "payment.completed"
    assert call_args[0][1]["orderId"] == "order-1"
    assert call_args[0][1]["amount"] == 99.99

    result = await session.execute(
        select(Payment).where(Payment.order_id == "order-1")
    )
    payment = result.scalar_one()
    assert payment.status == "completed"
    assert payment.transaction_id is not None
    assert payment.idempotency_key == "payment:order-1"


async def test_process_payment_idempotency(session, mock_publish):
    session.add(Payment(
        order_id="order-2", amount=50.0, status="completed",
        idempotency_key="payment:order-2",
    ))
    await session.commit()

    data = {"orderId": "order-2", "totalAmount": 50.0}

    with patch("app.events.async_session") as mock_async_session:
        mock_async_session.return_value.__aenter__.return_value = session
        await process_payment(data)

    mock_publish.assert_not_called()


async def test_process_payment_invalid_data(session, mock_publish):
    await process_payment({"orderId": None, "totalAmount": 0})

    mock_publish.assert_called_once()
    assert mock_publish.call_args[0][0] == "payment.failed"


async def test_refund_payment(session, mock_publish):
    session.add(Payment(
        order_id="order-3", amount=75.0, status="completed",
        transaction_id="tx-1",
    ))
    await session.commit()

    data = {"orderId": "order-3"}

    with patch("app.events.async_session") as mock_async_session:
        mock_async_session.return_value.__aenter__.return_value = session
        await refund_payment(data)

    result = await session.execute(
        select(Payment).where(Payment.order_id == "order-3")
    )
    payment = result.scalar_one()
    assert payment.status == "refunded"


async def test_refund_payment_nonexistent(session, mock_publish):
    await refund_payment({"orderId": "nonexistent-order"})

    result = await session.execute(
        select(Payment).where(Payment.order_id == "nonexistent-order")
    )
    assert result.scalar_one_or_none() is None
