FROM python:3.12-slim
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
COPY alembic.ini ./
COPY migrations/ ./migrations/
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh
EXPOSE 3004
ENTRYPOINT ["/wait-for-db.sh"]
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 3004"]
