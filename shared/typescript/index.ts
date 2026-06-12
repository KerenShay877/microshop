export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  CANCELLED = "cancelled",
}

export interface InventoryItem {
  productId: string;
  stock: number;
  reserved: number;
  available: number;
}

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: string;
}
