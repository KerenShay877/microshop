from datetime import datetime, timezone

from fastapi import FastAPI
import dotenv

dotenv.load_dotenv()

app = FastAPI(title="Payment Service")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "payment-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
