package messaging

import (
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/user/microshop/inventory-service/internal/repository"
)

const (
	Exchange = "microshop.events"
	Queue    = "inventory-service-queue"
)

type OrderCreatedEvent struct {
	OrderId    string `json:"orderId"`
	CustomerId string `json:"customerId"`
	Items      []struct {
		ProductId string  `json:"productId"`
		Quantity  int     `json:"quantity"`
		Price     float64 `json:"price"`
	} `json:"items"`
	TotalAmount float64 `json:"totalAmount"`
	Timestamp   string  `json:"timestamp"`
}

type OrderCancelledEvent struct {
	OrderId string `json:"orderId"`
	Reason  string `json:"reason"`
}

type InventoryReservedEvent struct {
	OrderId   string `json:"orderId"`
	Items     []struct {
		ProductId string `json:"productId"`
		Quantity  int    `json:"quantity"`
	} `json:"items"`
	Timestamp string `json:"timestamp"`
}

type InventoryReservationFailedEvent struct {
	OrderId     string `json:"orderId"`
	Reason      string `json:"reason"`
	FailedItems []struct {
		ProductId        string `json:"productId"`
		RequestedQuantity int   `json:"requestedQuantity"`
		AvailableStock   int    `json:"availableStock"`
	} `json:"failedItems"`
	Timestamp string `json:"timestamp"`
}

var conn *amqp.Connection
var channel *amqp.Channel

func Connect(url string) error {
	var err error
	conn, err = amqp.Dial(url)
	if err != nil {
		return err
	}
	channel, err = conn.Channel()
	if err != nil {
		return err
	}
	return channel.ExchangeDeclare(Exchange, "topic", true, false, false, false, nil)
}

func StartConsumer() error {
	q, err := channel.QueueDeclare(Queue, true, false, false, false, nil)
	if err != nil {
		return err
	}

	routingKeys := []string{"order.created", "order.cancelled"}
	for _, key := range routingKeys {
		if err := channel.QueueBind(q.Name, key, Exchange, false, nil); err != nil {
			return err
		}
	}

	msgs, err := channel.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		return err
	}

	go func() {
		for msg := range msgs {
			go handleMessage(msg.Body, msg.DeliveryTag)
		}
	}()

	log.Println("Inventory service consumer started")
	return nil
}

func PublishEvent(routingKey string, data interface{}) error {
	body, err := json.Marshal(map[string]interface{}{
		"type": routingKey,
		"data": data,
	})
	if err != nil {
		return err
	}
	return channel.Publish(Exchange, routingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp.Persistent,
	})
}

func handleMessage(body []byte, tag uint64) {
	var wrapper struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		log.Printf("Failed to parse message: %v", err)
		channel.Nack(tag, false, false)
		return
	}

	var err error
	switch wrapper.Type {
	case "order.created":
		err = handleOrderCreated(wrapper.Data)
	case "order.cancelled":
		err = handleOrderCancelled(wrapper.Data)
	default:
		log.Printf("Unknown event type: %s", wrapper.Type)
		channel.Ack(tag, false)
		return
	}

	if err != nil {
		log.Printf("Failed to handle event %s: %v", wrapper.Type, err)
		channel.Nack(tag, false, false)
		return
	}
	channel.Ack(tag, false)
}

func handleOrderCreated(data json.RawMessage) error {
	var evt OrderCreatedEvent
	if err := json.Unmarshal(data, &evt); err != nil {
		return err
	}

	var failedItems []struct {
		ProductId        string `json:"productId"`
		RequestedQuantity int   `json:"requestedQuantity"`
		AvailableStock   int    `json:"availableStock"`
	}

	for _, item := range evt.Items {
		ok, available, err := repository.TryReserve(item.ProductId, item.Quantity)
		if err != nil {
			return err
		}
		if !ok {
			failedItems = append(failedItems, struct {
				ProductId        string `json:"productId"`
				RequestedQuantity int   `json:"requestedQuantity"`
				AvailableStock   int    `json:"availableStock"`
			}{
				ProductId:        item.ProductId,
				RequestedQuantity: item.Quantity,
				AvailableStock:   available,
			})
		}
	}

	if len(failedItems) > 0 {
		return PublishEvent("inventory.reservation.failed", InventoryReservationFailedEvent{
			OrderId:     evt.OrderId,
			Reason:      "insufficient stock",
			FailedItems: failedItems,
			Timestamp:   nowISO(),
		})
	}

	var reservedItems []struct {
		ProductId string `json:"productId"`
		Quantity  int    `json:"quantity"`
	}
	for _, item := range evt.Items {
		reservedItems = append(reservedItems, struct {
			ProductId string `json:"productId"`
			Quantity  int    `json:"quantity"`
		}{ProductId: item.ProductId, Quantity: item.Quantity})
	}

	return PublishEvent("inventory.reserved", InventoryReservedEvent{
		OrderId:   evt.OrderId,
		Items:     reservedItems,
		Timestamp: nowISO(),
	})
}

func handleOrderCancelled(data json.RawMessage) error {
	var evt OrderCancelledEvent
	if err := json.Unmarshal(data, &evt); err != nil {
		return err
	}

	// We need order items to release; in a real impl we'd fetch from order-service
	log.Printf("Order %s cancelled: %s", evt.OrderId, evt.Reason)
	return nil
}

func nowISO() string {
	return time.Now().UTC().Format("2006-01-02T15:04:05Z")
}

func Close() {
	if channel != nil {
		channel.Close()
	}
	if conn != nil {
		conn.Close()
	}
}
