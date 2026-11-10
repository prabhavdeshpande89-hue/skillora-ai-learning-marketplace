from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.api.routes.products import router as products_router
from backend.app.services.ai_service import generate_learning_recommendations

router = APIRouter(prefix="/api/ai", tags=["AI Recommendations"])


class RecommendationRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=300)
    level: str = Field(..., min_length=3, max_length=30)
    budget: float = Field(..., gt=0, le=100000)


@router.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    # The catalogue is retrieved from the existing products API.
    from fastapi.testclient import TestClient
    from backend.app.main import app

    try:
        response = TestClient(app).get("/api/products/")

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Could not load the learning catalogue.",
            )

        resources = response.json()

        result = generate_learning_recommendations(
            goal=request.goal,
            level=request.level,
            budget=request.budget,
            resources=resources,
        )

        return {
            "goal": request.goal,
            "level": request.level,
            "budget": request.budget,
            "recommendations": result,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"AI recommendation error: {exc}")
        raise HTTPException(
            status_code=502,
            detail="AI recommendations are temporarily unavailable. Check the backend terminal.",
        )