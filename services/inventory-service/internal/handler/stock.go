package handler

import (
	"encoding/json"
	"net/http"

	"github.com/user/microshop/inventory-service/internal/repository"
)

func GetStock(w http.ResponseWriter, r *http.Request) {
	productId := r.PathValue("productId")
	if productId == "" {
		http.Error(w, "productId is required", http.StatusBadRequest)
		return
	}

	stock, reserved, err := repository.GetStock(productId)
	if err != nil {
		http.Error(w, "Stock not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"productId": productId,
		"stock":     stock,
		"reserved":  reserved,
		"available": stock - reserved,
	})
}

func SeedStock(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductId string `json:"productId"`
		Stock     int    `json:"stock"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := repository.SeedStock(req.ProductId, req.Stock); err != nil {
		http.Error(w, "Failed to seed stock", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"service":   "inventory-service",
		"timestamp": r.Context().Value("timestamp").(string),
	})
}
