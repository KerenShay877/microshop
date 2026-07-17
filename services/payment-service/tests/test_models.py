from sqlalchemy import select
from app.models import Payment


async def test_create_payment(session):
    payment = Payment(
        order_id="order-1",
        amount=99.99,
        status="pending",
    )
    session.add(payment)
    await session.commit()

    result = await session.execute(select(Payment).where(Payment.order_id == "order-1"))
    saved = result.scalar_one()
    assert saved.id is not None
    assert saved.order_id == "order-1"
    assert saved.amount == 99.99
    assert saved.status == "pending"


async def test_payment_with_idempotency_key(session):
    payment = Payment(
        order_id="order-2",
        amount=50.00,
        status="completed",
        idempotency_key="payment:order-2",
    )
    session.add(payment)
    await session.commit()

    result = await session.execute(
        select(Payment).where(Payment.idempotency_key == "payment:order-2")
    )
    found = result.scalar_one()
    assert found.idempotency_key == "payment:order-2"


async def test_payment_status_index(session):
    for i in range(3):
        session.add(Payment(order_id=f"order-{i}", amount=10.0, status="completed"))
    session.add(Payment(order_id="failed-1", amount=10.0, status="failed"))
    await session.commit()

    result = await session.execute(
        select(Payment).where(Payment.status == "completed")
    )
    completed = result.scalars().all()
    assert len(completed) == 3

    result = await session.execute(
        select(Payment).where(Payment.status == "failed")
    )
    failed = result.scalars().all()
    assert len(failed) == 1
