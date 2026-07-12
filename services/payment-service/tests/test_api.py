from app.models import Payment


async def test_list_payments_empty(client):
    resp = await client.get("/payments")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_payments(session, client):
    session.add(Payment(order_id="order-1", amount=99.99, status="completed"))
    session.add(Payment(order_id="order-2", amount=49.99, status="failed"))
    await session.commit()

    resp = await client.get("/payments")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["orderId"] in ("order-1", "order-2")


async def test_list_payments_filter_by_status(session, client):
    session.add(Payment(order_id="order-1", amount=99.99, status="completed"))
    session.add(Payment(order_id="order-2", amount=49.99, status="failed"))
    await session.commit()

    resp = await client.get("/payments?status=completed")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "completed"


async def test_get_payment_by_id(session, client):
    payment = Payment(order_id="order-1", amount=99.99, status="completed", transaction_id="tx-1")
    session.add(payment)
    await session.commit()

    resp = await client.get(f"/payments/{payment.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["orderId"] == "order-1"
    assert data["transactionId"] == "tx-1"


async def test_get_payment_not_found(client):
    resp = await client.get("/payments/nonexistent-id")
    assert resp.status_code == 404


async def test_refund_payment(session, client):
    payment = Payment(order_id="order-1", amount=99.99, status="completed")
    session.add(payment)
    await session.commit()

    resp = await client.post(f"/payments/{payment.id}/refund")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "refunded"


async def test_refund_already_refunded(session, client):
    payment = Payment(order_id="order-1", amount=99.99, status="refunded")
    session.add(payment)
    await session.commit()

    resp = await client.post(f"/payments/{payment.id}/refund")
    assert resp.status_code == 400


async def test_refund_pending_not_allowed(session, client):
    payment = Payment(order_id="order-1", amount=99.99, status="pending")
    session.add(payment)
    await session.commit()

    resp = await client.post(f"/payments/{payment.id}/refund")
    assert resp.status_code == 400
