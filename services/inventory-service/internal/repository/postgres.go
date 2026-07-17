package repository

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	mu   sync.Mutex
)

func Connect(databaseUrl string) error {
	var err error
	pool, err = pgxpool.New(context.Background(), databaseUrl)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}
	return pool.Ping(context.Background())
}

func InitSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS stock_items (
		product_id TEXT PRIMARY KEY,
		stock INTEGER NOT NULL DEFAULT 0,
		reserved INTEGER NOT NULL DEFAULT 0
	);
	`
	_, err := pool.Exec(context.Background(), schema)
	return err
}

func GetStock(productId string) (int, int, error) {
	var stock, reserved int
	err := pool.QueryRow(
		context.Background(),
		"SELECT stock, reserved FROM stock_items WHERE product_id = $1",
		productId,
	).Scan(&stock, &reserved)
	return stock, reserved, err
}

func TryReserve(productId string, quantity int) (bool, int, error) {
	mu.Lock()
	defer mu.Unlock()

	var stock, reserved int
	err := pool.QueryRow(
		context.Background(),
		"SELECT stock, reserved FROM stock_items WHERE product_id = $1 FOR UPDATE",
		productId,
	).Scan(&stock, &reserved)
	if err != nil {
		return false, 0, err
	}

	available := stock - reserved
	if available < quantity {
		return false, available, nil
	}

	_, err = pool.Exec(
		context.Background(),
		"UPDATE stock_items SET reserved = reserved + $1 WHERE product_id = $2",
		quantity, productId,
	)
	if err != nil {
		return false, 0, err
	}

	return true, 0, nil
}

func ReleaseReservation(productId string, quantity int) error {
	_, err := pool.Exec(
		context.Background(),
		"UPDATE stock_items SET reserved = GREATEST(reserved - $1, 0) WHERE product_id = $2",
		quantity, productId,
	)
	return err
}

func SeedStock(productId string, stock int) error {
	_, err := pool.Exec(
		context.Background(),
		`INSERT INTO stock_items (product_id, stock, reserved) VALUES ($1, $2, 0)
		 ON CONFLICT (product_id) DO UPDATE SET stock = $2`,
		productId, stock,
	)
	return err
}

func Close() {
	if pool != nil {
		pool.Close()
	}
}
