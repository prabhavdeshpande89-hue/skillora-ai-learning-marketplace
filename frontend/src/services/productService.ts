
import type { Resource } from "../components/products/ResourceCard";

const API_BASE_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
}/api`;

export async function getProducts(): Promise<Resource[]> {
  const response = await fetch(`${API_BASE_URL}/products/`);

  if (!response.ok) {
    throw new Error("Failed to load learning resources.");
  }

  return response.json();
}

export async function getProductById(id: string): Promise<Resource> {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(id)}`
  );

  if (!response.ok) {
    throw new Error("Failed to load the learning resource.");
  }

  return response.json();
}
