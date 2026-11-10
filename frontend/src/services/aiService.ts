const API_BASE_URL = "http://127.0.0.1:8000";

export interface RecommendationRequest {
  goal: string;
  level: string;
  budget: number;
}

export interface RecommendationResponse {
  goal: string;
  level: string;
  budget: number;
  recommendations: string;
}

export async function getAIRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai/recommendations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to get AI recommendations (${response.status}).`
    );
  }

  return (await response.json()) as RecommendationResponse;
}