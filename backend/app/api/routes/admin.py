
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Body, Depends, HTTPException

from backend.app.api.routes.auth import get_current_admin
from backend.app.db.mongodb import database

router = APIRouter(prefix="/api/admin", tags=["Admin"])

users_collection = database["users"]
resources_collection = database["resources"]
payments_collection = database["payments"]


# --------------------------------------------------
# USER MANAGEMENT
# --------------------------------------------------

def serialize_admin_user(user: dict[str, Any]) -> dict[str, Any]:
    created_at = user.get("created_at")

    return {
        "id": str(user["_id"]),
        "name": user.get("name", "Unknown"),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "status": "Active" if user.get("is_active", True) else "Blocked",
        "joinedAt": created_at.isoformat() if isinstance(created_at, datetime) else None,
        "coursesEnrolled": 0,
    }


@router.get("/users")
async def get_admin_users(
    current_admin: dict = Depends(get_current_admin),
):
    users = list(
        users_collection.find(
            {},
            {"password_hash": 0}
        ).sort("created_at", -1)
    )

    return {
        "users": [serialize_admin_user(user) for user in users],
        "total": len(users),
    }


# --------------------------------------------------
# DASHBOARD STATISTICS
# --------------------------------------------------

@router.get("/stats")
async def get_admin_stats(
    current_admin: dict = Depends(get_current_admin),
):
    total_users = users_collection.count_documents({})
    active_users = users_collection.count_documents(
        {"is_active": {"$ne": False}}
    )
    blocked_users = users_collection.count_documents(
        {"is_active": False}
    )
    administrators = users_collection.count_documents(
        {"role": "admin"}
    )

    total_resources = resources_collection.count_documents({})
    total_payments = payments_collection.count_documents({})
    successful_payments = payments_collection.count_documents(
        {"status": "success"}
    )

    revenue_pipeline = [
        {"$match": {"status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    revenue_result = list(payments_collection.aggregate(revenue_pipeline))
    platform_revenue = (
        revenue_result[0]["total"] if revenue_result else 0
    )

    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "blockedUsers": blocked_users,
        "administrators": administrators,
        "totalResources": total_resources,
        "totalPayments": total_payments,
        "successfulPayments": successful_payments,
        "platformRevenue": platform_revenue,
    }


# --------------------------------------------------
# RESOURCE SERIALIZATION
# --------------------------------------------------

def serialize_resource(resource: dict[str, Any]) -> dict[str, Any]:
    created_at = resource.get("createdAt")

    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    return {
        "id": str(resource["_id"]),
        "title": resource.get("title", ""),
        "category": resource.get("category", "Other"),
        "description": resource.get("description", ""),
        "instructor": resource.get("instructor", ""),
        "price": float(resource.get("price", 0)),
        "level": resource.get("level", "Beginner"),
        "status": resource.get("status", "Draft"),
        "createdAt": created_at,
    }


# --------------------------------------------------
# RESOURCE VALIDATION
# --------------------------------------------------

def validate_resource_data(data: dict[str, Any]):
    required_fields = [
        "title",
        "category",
        "description",
        "instructor",
        "price",
        "level",
        "status",
    ]

    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required."
            )

    if not isinstance(data["title"], str) or not data["title"].strip():
        raise HTTPException(status_code=400, detail="Invalid resource title.")

    if not isinstance(data["description"], str) or not data["description"].strip():
        raise HTTPException(status_code=400, detail="Invalid description.")

    if not isinstance(data["instructor"], str) or not data["instructor"].strip():
        raise HTTPException(status_code=400, detail="Invalid instructor.")

    try:
        price = float(data["price"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid resource price.")

    if price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative.")

    if data["level"] not in ["Beginner", "Intermediate", "Advanced"]:
        raise HTTPException(status_code=400, detail="Invalid resource level.")

    if data["status"] not in ["Published", "Draft"]:
        raise HTTPException(status_code=400, detail="Invalid resource status.")

    cleaned_data = {
        "title": data["title"].strip(),
        "category": str(data["category"]).strip(),
        "description": data["description"].strip(),
        "instructor": data["instructor"].strip(),
        "price": price,
        "level": data["level"],
        "status": data["status"],
    }

    return cleaned_data


# --------------------------------------------------
# RESOURCE MANAGEMENT - GET
# --------------------------------------------------

@router.get("/resources")
async def get_admin_resources(
    current_admin: dict = Depends(get_current_admin),
):
    resources = list(
        resources_collection.find({}).sort("createdAt", -1)
    )

    return {
        "resources": [
            serialize_resource(resource)
            for resource in resources
        ],
        "total": len(resources),
    }


# --------------------------------------------------
# RESOURCE MANAGEMENT - CREATE
# --------------------------------------------------

@router.post("/resources", status_code=201)
async def create_resource(
    data: dict[str, Any] = Body(...),
    current_admin: dict = Depends(get_current_admin),
):
    resource_data = validate_resource_data(data)

    resource_data["createdAt"] = datetime.now(timezone.utc)
    resource_data["updatedAt"] = datetime.now(timezone.utc)

    result = resources_collection.insert_one(resource_data)

    created_resource = resources_collection.find_one(
        {"_id": result.inserted_id}
    )

    return {
        "message": "Resource created successfully.",
        "resource": serialize_resource(created_resource),
    }


# --------------------------------------------------
# RESOURCE MANAGEMENT - UPDATE
# --------------------------------------------------

@router.put("/resources/{resource_id}")
async def update_resource(
    resource_id: str,
    data: dict[str, Any] = Body(...),
    current_admin: dict = Depends(get_current_admin),
):
    try:
        object_id = ObjectId(resource_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid resource ID."
        )

    existing_resource = resources_collection.find_one(
        {"_id": object_id}
    )

    if not existing_resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found."
        )

    resource_data = validate_resource_data(data)
    resource_data["updatedAt"] = datetime.now(timezone.utc)

    resources_collection.update_one(
        {"_id": object_id},
        {"$set": resource_data}
    )

    updated_resource = resources_collection.find_one(
        {"_id": object_id}
    )

    return {
        "message": "Resource updated successfully.",
        "resource": serialize_resource(updated_resource),
    }


# --------------------------------------------------
# RESOURCE MANAGEMENT - DELETE
# --------------------------------------------------

@router.delete("/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    try:
        object_id = ObjectId(resource_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid resource ID."
        )

    result = resources_collection.delete_one(
        {"_id": object_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Resource not found."
        )

    return {
        "message": "Resource deleted successfully."
    }


# --------------------------------------------------
# PAYMENT MANAGEMENT - GET TRANSACTIONS
# --------------------------------------------------

def serialize_admin_payment(payment: dict[str, Any]) -> dict[str, Any]:
    created_at = payment.get("created_at")
    captured_at = payment.get("captured_at")

    status_map = {
        "success": "Completed",
        "completed": "Completed",
        "pending": "Pending",
        "failed": "Failed",
        "refunded": "Refunded",
        "cancelled": "Failed",
    }

    products = payment.get("resource_names", [])

    return {
        "id": str(payment["_id"]),
        "paypalOrderId": payment.get("paypal_order_id", ""),
        "captureId": payment.get("paypal_capture_id"),
        "customer": payment.get("customer_name", "Unknown"),
        "email": payment.get("customer_email", ""),
        "resource": ", ".join(products) if products else "Unknown",
        "amount": float(payment.get("amount", 0)),
        "currency": payment.get("currency", "INR"),
        "paypalAmount": float(payment.get("paypal_amount", 0)),
        "paypalCurrency": payment.get("paypal_currency", "USD"),
        "method": payment.get("payment_method", "PayPal"),
        "date": created_at.isoformat() if isinstance(created_at, datetime) else None,
        "capturedAt": captured_at.isoformat() if isinstance(captured_at, datetime) else None,
        "status": status_map.get(
            str(payment.get("status", "pending")).lower(),
            "Pending",
        ),
    }


@router.get("/payments")
async def get_admin_payments(
    current_admin: dict = Depends(get_current_admin),
):
    payments = list(
        payments_collection.find({}).sort("created_at", -1)
    )

    serialized = [
        serialize_admin_payment(payment)
        for payment in payments
    ]

    return {
        "payments": serialized,
        "total": len(serialized),
    }