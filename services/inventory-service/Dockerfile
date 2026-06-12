FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /inventory-service ./cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /inventory-service /inventory-service
EXPOSE 3003
CMD ["/inventory-service"]
