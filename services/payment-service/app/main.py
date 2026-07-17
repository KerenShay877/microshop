import asyncio
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
import dotenv

from app.events import connect, start_consumer
from app.routes.payments import router as payments_router

dotenv.load_dotenv()
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    asyncio.create_task(start_consumer())
    yield


app = FastAPI(title="Payment Service", lifespan=lifespan)
app.include_router(payments_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "payment-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
