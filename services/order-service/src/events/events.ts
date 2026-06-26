export enum EventType {
  ORDER_CREATED = "order.created",
  INVENTORY_RESERVED = "inventory.reserved",
  INVENTORY_RESERVATION_FAILED = "inventory.reservation.failed",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",
  ORDER_CONFIRMED = "order.confirmed",
  ORDER_CANCELLED = "order.cancelled",
}

export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  timestamp: string;
}

export interface InventoryReservedEvent {
  orderId: string;
  items: { productId: string; quantity: number }[];
  timestamp: string;
}

export interface InventoryReservationFailedEvent {
  orderId: string;
  reason: string;
  failedItems: { productId: string; requestedQuantity: number; availableStock: number }[];
  timestamp: string;
}

export interface PaymentCompletedEvent {
  orderId: string;
  transactionId: string;
  amount: number;
  timestamp: string;
}

export interface PaymentFailedEvent {
  orderId: string;
  reason: string;
  timestamp: string;
}

export interface OrderConfirmedEvent {
  orderId: string;
  transactionId: string;
  timestamp: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  reason: string;
  timestamp: string;
}
