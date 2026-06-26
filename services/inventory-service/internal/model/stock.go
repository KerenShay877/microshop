package model

type StockItem struct {
	ProductId string `json:"productId"`
	Stock     int    `json:"stock"`
	Reserved  int    `json:"reserved"`
}

type ReserveRequest struct {
	OrderId string           `json:"orderId"`
	Items   []ReserveItem    `json:"items"`
}

type ReserveItem struct {
	ProductId string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

type ReserveResult struct {
	Success     bool              `json:"success"`
	OrderId     string            `json:"orderId"`
	FailedItems []FailedItem      `json:"failedItems,omitempty"`
}

type FailedItem struct {
	ProductId        string `json:"productId"`
	RequestedQuantity int   `json:"requestedQuantity"`
	AvailableStock   int    `json:"availableStock"`
}
