
import { authService } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// --------------------------------------------------
// PURCHASE HISTORY TYPES
// --------------------------------------------------

export interface PurchasedResource {
  id: string | number;
  title: string;
  price: number;
}

export interface Purchase {
  paypal_order_id: string;
  paypal_capture_id?: string;
  products: PurchasedResource[];
  resource_names: string[];
  amount: number;
  currency: string;
  paypal_amount?: number;
  paypal_currency?: string;
  payment_method: string;
  status: string;
  created_at?: string | null;
  captured_at?: string | null;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  user: {
    name: string;
    email: string;
  };
  summary: {
    total_purchases: number;
    total_resources: number;
    total_spent: number;
    currency: string;
  };
  purchases: Purchase[];
}

// --------------------------------------------------
// PAYPAL RESPONSE TYPES
// --------------------------------------------------

export interface CreateOrderResponse {
  id: string;
  approval_url: string;
  currency: string;
  test_amount: number;
}

export interface CaptureOrderResponse {
  success: boolean;
  status: string;
  message?: string;
}

// --------------------------------------------------
// COMMON API REQUEST
// --------------------------------------------------

async function paymentRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = authService.getToken();

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/payments/${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || "Payment request failed."
    );
  }

  return data as T;
}

// --------------------------------------------------
// CREATE PAYPAL ORDER
// --------------------------------------------------

export async function createPaymentOrder(
  productIds: (string | number)[]
): Promise<CreateOrderResponse> {
  return paymentRequest<CreateOrderResponse>(
    "create-order",
    {
      product_ids: productIds.map(String),
    }
  );
}

// --------------------------------------------------
// CAPTURE PAYPAL ORDER
// --------------------------------------------------

export async function capturePaymentOrder(
  orderId: string
): Promise<CaptureOrderResponse> {
  return paymentRequest<CaptureOrderResponse>(
    "capture-order",
    {
      order_id: orderId,
    }
  );
}

// --------------------------------------------------
// GET USER PURCHASE HISTORY
// --------------------------------------------------

export async function getMyPurchases(): Promise<PurchaseHistoryResponse> {
  const token = authService.getToken();

  if (!token) {
    throw new Error("Please log in to view your purchases.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/payments/my-purchases`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || "Failed to load purchase history."
    );
  }

  return data as PurchaseHistoryResponse;
}
