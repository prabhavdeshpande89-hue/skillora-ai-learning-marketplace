
import base64
import os
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.api.routes.auth import get_current_user
from backend.app.db.mongodb import database

router = APIRouter(prefix="/api/payments", tags=["Payments"])

payments_collection = database["payments"]
resources_collection = database["resources"]

payments_collection.create_index("paypal_order_id", unique=True)


# --------------------------------------------------
# PAYPAL SANDBOX CONFIGURATION
# --------------------------------------------------

PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox").strip().lower()

if PAYPAL_MODE != "sandbox":
    raise RuntimeError("This application is configured for PayPal Sandbox only.")

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"
PAYPAL_CURRENCY = "USD"

try:
    INR_PER_USD = Decimal(os.getenv("INR_PER_USD", "88.00"))
except Exception as exc:
    raise RuntimeError("INR_PER_USD must be a valid positive number.") from exc

if not INR_PER_USD.is_finite() or INR_PER_USD <= 0:
    raise RuntimeError("INR_PER_USD must be a finite positive number.")


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class CreateOrderRequest(BaseModel):
    product_ids: List[str] = Field(min_length=1)


class CaptureOrderRequest(BaseModel):
    order_id: str = Field(min_length=1, max_length=100)


# --------------------------------------------------
# PRODUCT VALIDATION
# --------------------------------------------------

def get_product_bundle(product_ids: List[str]):

    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate product IDs are not allowed.",
        )

    object_ids = []

    for product_id in product_ids:

        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid resource ID: {product_id}",
            )

        object_ids.append(ObjectId(product_id))

    resources = list(resources_collection.find({
        "_id": {"$in": object_ids},
        "status": "Published",
    }))

    resources_by_id = {
        str(resource["_id"]): resource
        for resource in resources
    }

    selected = []

    for product_id in product_ids:

        resource = resources_by_id.get(product_id)

        if not resource:
            raise HTTPException(
                status_code=404,
                detail=f"Published resource {product_id} was not found.",
            )

        selected.append({
            "id": str(resource["_id"]),
            "title": resource.get("title", ""),
            "price": float(resource.get("price", 0)),
        })

    total_inr = sum(
        (Decimal(str(product["price"])) for product in selected),
        Decimal("0.00"),
    )

    if not total_inr.is_finite() or total_inr <= 0:
        raise HTTPException(
            status_code=400,
            detail="Order amount must be greater than zero.",
        )

    return selected, total_inr


def convert_inr_to_usd(total_inr: Decimal) -> Decimal:

    return (total_inr / INR_PER_USD).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


# --------------------------------------------------
# PAYPAL AUTHENTICATION
# --------------------------------------------------

async def get_paypal_access_token() -> str:

    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="PayPal Sandbox credentials are not configured.",
        )

    credentials = f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}"

    encoded_credentials = base64.b64encode(
        credentials.encode("utf-8")
    ).decode("utf-8")

    try:

        async with httpx.AsyncClient(timeout=20.0) as client:

            response = await client.post(
                f"{PAYPAL_BASE_URL}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {encoded_credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"grant_type": "client_credentials"},
            )

        if response.is_error:

            print("PayPal authentication error:", response.text)

            raise HTTPException(
                status_code=502,
                detail="PayPal authentication failed.",
            )

        access_token = response.json().get("access_token")

        if not access_token:

            raise HTTPException(
                status_code=502,
                detail="PayPal did not return an access token.",
            )

        return access_token

    except httpx.HTTPError as exc:

        raise HTTPException(
            status_code=502,
            detail="Unable to connect to PayPal authentication.",
        ) from exc


# --------------------------------------------------
# CREATE PAYPAL ORDER
# POST /api/payments/create-order
# --------------------------------------------------

@router.post("/create-order")
async def create_order(
    request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):

    selected, total_inr = get_product_bundle(request.product_ids)

    usd_amount = convert_inr_to_usd(total_inr)

    if usd_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Converted USD amount must be greater than zero.",
        )

    usd_amount_string = format(usd_amount, ".2f")

    access_token = await get_paypal_access_token()

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "description": "Skillora AI learning resources",
                "custom_id": ",".join(
                    product["id"] for product in selected
                ),
                "amount": {
                    "currency_code": PAYPAL_CURRENCY,
                    "value": usd_amount_string,
                },
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "brand_name": "Skillora AI",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "PAY_NOW",
                    "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payment-success",
                    "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payment-cancel",
                }
            }
        },
    }

    try:

        async with httpx.AsyncClient(timeout=20.0) as client:

            response = await client.post(
                f"{PAYPAL_BASE_URL}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.is_error:

            print("PayPal create-order error:", response.text)

            raise HTTPException(
                status_code=502,
                detail="PayPal could not create the order.",
            )

        data = response.json()

        order_id = data.get("id")

        approval_url = next(
            (
                link["href"]
                for link in data.get("links", [])
                if link.get("rel") in ("approve", "payer-action")
            ),
            None,
        )

        if not order_id or not approval_url:

            raise HTTPException(
                status_code=502,
                detail="PayPal did not return a valid order or approval URL.",
            )

        now = datetime.now(timezone.utc)

        payment_record = {
            "paypal_order_id": order_id,
            "paypal_capture_id": None,
            "user_id": str(current_user["_id"]),
            "customer_name": current_user.get("name", "Unknown"),
            "customer_email": current_user.get("email", ""),
            "products": selected,
            "resource_names": [
                product["title"] for product in selected
            ],
            "amount": float(total_inr),
            "currency": "INR",
            "paypal_amount": float(usd_amount),
            "paypal_currency": PAYPAL_CURRENCY,
            "exchange_rate_inr_per_usd": float(INR_PER_USD),
            "payment_method": "PayPal",
            "status": "pending",
            "created_at": now,
            "updated_at": now,
            "captured_at": None,
        }

        try:

            payments_collection.insert_one(payment_record)

        except Exception as exc:

            print("MongoDB payment order save error:", repr(exc))

            raise HTTPException(
                status_code=500,
                detail=(
                    "PayPal order created but could not be saved. "
                    "Contact support before retrying checkout."
                ),
            ) from exc

        return {
            "id": order_id,
            "status": data.get("status"),
            "currency": PAYPAL_CURRENCY,
            "paypal_amount": format(usd_amount, ".2f"),
            "original_total_inr": float(total_inr),
            "exchange_rate_inr_per_usd": str(INR_PER_USD),
            "products": payment_record["products"],
            "approval_url": approval_url,
        }

    except httpx.HTTPError as exc:

        raise HTTPException(
            status_code=502,
            detail="Unable to connect to PayPal order creation.",
        ) from exc


# --------------------------------------------------
# CAPTURE PAYPAL ORDER
# POST /api/payments/capture-order
# --------------------------------------------------

@router.post("/capture-order")
async def capture_order(
    request: CaptureOrderRequest,
    current_user: dict = Depends(get_current_user),
):

    payment = payments_collection.find_one({
        "paypal_order_id": request.order_id,
        "user_id": str(current_user["_id"]),
    })

    if not payment:

        raise HTTPException(
            status_code=404,
            detail="Payment order not found for this account.",
        )

    if payment.get("status") == "success":

        return {
            "success": True,
            "status": "COMPLETED",
            "paypal_order_id": request.order_id,
            "capture_id": payment.get("paypal_capture_id"),
            "message": "This payment has already been captured.",
        }

    access_token = await get_paypal_access_token()

    try:

        async with httpx.AsyncClient(timeout=20.0) as client:

            response = await client.post(
                f"{PAYPAL_BASE_URL}/v2/checkout/orders/"
                f"{request.order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={},
            )

        if response.is_error:

            print("PayPal capture error:", response.text)

            raise HTTPException(
                status_code=502,
                detail="PayPal could not capture this order.",
            )

        data = response.json()

        captures = []

        for unit in data.get("purchase_units", []):

            for capture in unit.get("payments", {}).get("captures", []):

                if capture.get("status") == "COMPLETED":
                    captures.append(capture)

        if data.get("status") != "COMPLETED" or not captures:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Payment is not completed. "
                    f"PayPal status: {data.get('status')}"
                ),
            )

        capture = captures[0]

        capture_amount = capture.get("amount", {})

        if capture_amount.get("currency_code") != payment["paypal_currency"]:

            raise HTTPException(
                status_code=400,
                detail="Captured payment currency does not match the order.",
            )

        expected_usd = Decimal(str(payment["paypal_amount"]))

        actual_usd = Decimal(str(capture_amount.get("value", "0")))

        if actual_usd != expected_usd:

            raise HTTPException(
                status_code=400,
                detail="Captured amount does not match the original order.",
            )

        now = datetime.now(timezone.utc)

        payments_collection.update_one(
            {
                "_id": payment["_id"],
                "status": "pending",
            },
            {
                "$set": {
                    "status": "success",
                    "paypal_capture_id": capture.get("id"),
                    "captured_at": now,
                    "updated_at": now,
                }
            },
        )

        updated_payment = payments_collection.find_one({
            "_id": payment["_id"]
        })

        if updated_payment.get("status") != "success":

            raise HTTPException(
                status_code=409,
                detail="Payment record could not be marked as completed.",
            )

        return {
            "success": True,
            "status": "COMPLETED",
            "paypal_order_id": data["id"],
            "captures": [
                {
                    "capture_id": capture.get("id"),
                    "amount": capture_amount,
                }
            ],
            "message": "Payment captured and saved successfully.",
        }

    except httpx.HTTPError as exc:

        raise HTTPException(
            status_code=502,
            detail="Unable to connect to PayPal capture.",
        ) from exc


# --------------------------------------------------
# GET LOGGED-IN USER'S PURCHASE HISTORY
# GET /api/payments/my-purchases
# --------------------------------------------------

@router.get("/my-purchases")
async def get_my_purchases(
    current_user: dict = Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    payments = list(
        payments_collection.find(
            {
                "user_id": user_id,
                "status": "success",
            },
            {
                "_id": 0,
                "paypal_order_id": 1,
                "paypal_capture_id": 1,
                "products": 1,
                "resource_names": 1,
                "amount": 1,
                "currency": 1,
                "paypal_amount": 1,
                "paypal_currency": 1,
                "payment_method": 1,
                "status": 1,
                "created_at": 1,
                "captured_at": 1,
            },
        ).sort("captured_at", -1)
    )

    total_spent = sum(
        float(payment.get("amount", 0))
        for payment in payments
    )

    total_resources = sum(
        len(payment.get("products", []))
        for payment in payments
    )

    purchase_history = []

    for payment in payments:

        payment["created_at"] = (
            payment["created_at"].isoformat()
            if payment.get("created_at")
            else None
        )

        payment["captured_at"] = (
            payment["captured_at"].isoformat()
            if payment.get("captured_at")
            else None
        )

        purchase_history.append(payment)

    return {
        "success": True,
        "user": {
            "name": current_user.get("name", ""),
            "email": current_user.get("email", ""),
        },
        "summary": {
            "total_purchases": len(payments),
            "total_resources": total_resources,
            "total_spent": round(total_spent, 2),
            "currency": "INR",
        },
        "purchases": purchase_history,
    }
