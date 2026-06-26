package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/user/microshop/inventory-service/internal/handler"
	"github.com/user/microshop/inventory-service/internal/messaging"
	"github.com/user/microshop/inventory-service/internal/repository"
)

func main() {
	port := os.Getenv("INVENTORY_SERVICE_PORT")
	if port == "" {
		port = "3003"
	}
	dbUrl := os.Getenv("INVENTORY_DB_URL")
	if dbUrl == "" {
		dbUrl = "postgresql://postgres:postgres@localhost:5434/inventory"
	}
	rmqUrl := os.Getenv("RABBITMQ_URL")
	if rmqUrl == "" {
		rmqUrl = "amqp://guest:guest@localhost:5672"
	}

	if err := repository.Connect(dbUrl); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer repository.Close()

	if err := repository.InitSchema(); err != nil {
		log.Fatalf("Failed to init schema: %v", err)
	}

	if err := messaging.Connect(rmqUrl); err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer messaging.Close()

	if err := messaging.StartConsumer(); err != nil {
		log.Fatalf("Failed to start consumer: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /stock/{productId}", handler.GetStock)
	mux.HandleFunc("POST /stock/seed", handler.SeedStock)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Inventory service running on port %s", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"service":   "inventory-service",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
