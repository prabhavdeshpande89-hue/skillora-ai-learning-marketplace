
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from backend.app.db.mongodb import database

router = APIRouter(prefix="/api/products", tags=["Products"])

resources_collection = database["resources"]

CATEGORY_COLORS = {
    "Artificial Intelligence": "violet",
    "Web Development": "blue",
    "Data Science": "emerald",
    "Cloud Computing": "cyan",
    "Cybersecurity": "pink",
    "Other": "amber",
}


def serialize_product(resource):
    category = resource.get("category", "Other")

    return {
        "id": str(resource["_id"]),
        "title": resource.get("title", ""),
        "category": category,
        "type": resource.get("type", "Course"),
        "price": float(resource.get("price", 0)),
        "rating": float(resource.get("rating", 0)),
        "duration": resource.get("duration", "Self-paced"),
        "level": resource.get("level", "Beginner"),
        "description": resource.get("description", ""),
        "color": resource.get(
            "color",
            CATEGORY_COLORS.get(category, "violet"),
        ),
    }


@router.get("/")
def get_products():
    resources = resources_collection.find({
        "status": "Published"
    }).sort("createdAt", -1)

    return [
        serialize_product(resource)
        for resource in resources
    ]


@router.get("/{product_id}")
def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid resource ID.",
        )

    resource = resources_collection.find_one({
        "_id": ObjectId(product_id),
        "status": "Published",
    })

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Published resource not found.",
        )

    return serialize_product(resource)
