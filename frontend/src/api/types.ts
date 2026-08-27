export type Role = 'BUYER' | 'SELLER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  images?: ProductImage[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  priceCents: number;
}

export type SuborderStatus = 'PAID' | 'SHIPPED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  suborderId: string;
  productId: string;
  quantity: number;
  unitPriceAtPurchaseCents: number;
}

export interface Suborder {
  id: string;
  orderId: string;
  sellerId: string;
  status: SuborderStatus;
  subtotalCents: number;
  orderItems: OrderItem[];
}

export interface Order {
  id: string;
  buyerId: string;
  totalAmountCents: number;
  createdAt: string;
  suborders: Suborder[];
}
