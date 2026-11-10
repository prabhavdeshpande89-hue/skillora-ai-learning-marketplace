
import { authService } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// USER MANAGEMENT

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "Active" | "Blocked";
  joinedAt: string | null;
  coursesEnrolled: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export interface UserStatusResponse {
  success: boolean;
  message: string;
  user_id: string;
  is_active: boolean;
}

// DASHBOARD STATISTICS

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  administrators: number;
  totalResources: number;
  totalPayments: number;
  successfulPayments: number;
  platformRevenue: number;
}

// RESOURCE MANAGEMENT

export type ResourceStatus = "Published" | "Draft";
export type ResourceLevel = "Beginner" | "Intermediate" | "Advanced";

export interface AdminResource {
  id: string;
  title: string;
  category: string;
  description: string;
  instructor: string;
  price: number;
  level: ResourceLevel;
  status: ResourceStatus;
  createdAt: string | null;
}

export interface ResourceFormData {
  title: string;
  category: string;
  description: string;
  instructor: string;
  price: number;
  level: ResourceLevel;
  status: ResourceStatus;
}

export interface AdminResourcesResponse {
  resources: AdminResource[];
  total: number;
}

export interface ResourceMutationResponse {
  message: string;
  resource?: AdminResource;
}

// PAYMENT MANAGEMENT

export type AdminPaymentStatus =
  | "Completed"
  | "Pending"
  | "Failed"
  | "Refunded";

export interface AdminPayment {
  id: string;
  paypalOrderId: string;
  captureId: string | null;
  customer: string;
  email: string;
  resource: string;
  amount: number;
  currency: string;
  paypalAmount: number;
  paypalCurrency: string;
  method: string;
  date: string | null;
  capturedAt: string | null;
  status: AdminPaymentStatus;
}

export interface AdminPaymentsResponse {
  payments: AdminPayment[];
  total: number;
}

// SHARED ADMIN REQUEST

async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authService.getToken();

  if (!token) {
    throw new Error("Please log in as an administrator.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.detail ||
        result?.message ||
        `Admin request failed (${response.status}).`
    );
  }

  return result as T;
}

// ADMIN SERVICE

export const adminService = {
  // USERS

  getUsers(): Promise<AdminUsersResponse> {
    return adminRequest<AdminUsersResponse>("/api/admin/users");
  },

  // USERS: BLOCK / UNBLOCK

updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<UserStatusResponse> {
  return adminRequest<UserStatusResponse>(
    `/api/auth/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );
},

  // DASHBOARD

  getStats(): Promise<AdminStats> {
    return adminRequest<AdminStats>("/api/admin/stats");
  },

  // RESOURCES: GET

  getResources(): Promise<AdminResourcesResponse> {
    return adminRequest<AdminResourcesResponse>("/api/admin/resources");
  },

  // RESOURCES: CREATE

  createResource(data: ResourceFormData): Promise<ResourceMutationResponse> {
    return adminRequest<ResourceMutationResponse>("/api/admin/resources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // RESOURCES: UPDATE

  updateResource(
    id: string,
    data: ResourceFormData
  ): Promise<ResourceMutationResponse> {
    return adminRequest<ResourceMutationResponse>(
      `/api/admin/resources/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  // RESOURCES: DELETE

  deleteResource(id: string): Promise<{ message: string }> {
    return adminRequest<{ message: string }>(
      `/api/admin/resources/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
  },

  // PAYMENTS: GET REAL TRANSACTIONS

  getPayments(): Promise<AdminPaymentsResponse> {
    return adminRequest<AdminPaymentsResponse>("/api/admin/payments");
  },
};
