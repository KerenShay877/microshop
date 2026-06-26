FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /inventory-service ./cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates netcat-openbsd
COPY --from=builder /inventory-service /inventory-service
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh
EXPOSE 3003
ENTRYPOINT ["/wait-for-db.sh", "/inventory-service"]
