from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.models import Payment

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("")
async def list_payments(
    order_id: str | None = Query(None),
    status: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Payment).order_by(Payment.created_at.desc())
    if order_id:
        stmt = stmt.where(Payment.order_id == order_id)
    if status:
        stmt = stmt.where(Payment.status == status)
    result = await session.execute(stmt)
    payments = result.scalars().all()
    return [
        {
            "id": p.id,
            "orderId": p.order_id,
            "amount": p.amount,
            "status": p.status,
            "transactionId": p.transaction_id,
            "createdAt": p.created_at.isoformat() if p.created_at else None,
            "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in payments
    ]


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "id": payment.id,
        "orderId": payment.order_id,
        "amount": payment.amount,
        "status": payment.status,
        "transactionId": payment.transaction_id,
        "createdAt": payment.created_at.isoformat() if payment.created_at else None,
        "updatedAt": payment.updated_at.isoformat() if payment.updated_at else None,
    }


@router.post("/{payment_id}/refund")
async def refund_payment_manual(
    payment_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != "completed":
        raise HTTPException(status_code=400, detail=f"Cannot refund payment with status '{payment.status}'")
    payment.status = "refunded"
    await session.commit()
    return {
        "id": payment.id,
        "orderId": payment.order_id,
        "status": payment.status,
        "message": "Payment refunded",
    }
