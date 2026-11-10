
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel

from backend.app.db.mongodb import database
from backend.app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

users_collection = database["users"]

users_collection.create_index("email", unique=True)

bearer_scheme = HTTPBearer(auto_error=False)

class UpdateUserStatusRequest(BaseModel):
    is_active: bool


# --------------------------------------------------
# SERIALIZE USER INFORMATION
# --------------------------------------------------

def public_user(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "user"),
    )


# --------------------------------------------------
# CREATE JWT ACCESS TOKEN
# --------------------------------------------------

def create_user_token(user: dict) -> str:
    return create_access_token(
        data={
            "sub": str(user["_id"]),
            "role": user.get("role", "user"),
        }
    )


# --------------------------------------------------
# GET CURRENT AUTHENTICATED USER
# --------------------------------------------------

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict:

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise ValueError("Invalid user ID")

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = users_collection.find_one(
        {"_id": ObjectId(user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    return user


# --------------------------------------------------
# GET CURRENT ADMINISTRATOR
# --------------------------------------------------

async def get_current_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )

    return current_user


# --------------------------------------------------
# REGISTER NEW USER
# --------------------------------------------------

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(data: RegisterRequest):

    name = data.name.strip()
    email = str(data.email).strip().lower()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot be empty.",
        )

    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = {
        "name": name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)

    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    created_user = users_collection.find_one(
        {"_id": result.inserted_id}
    )

    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account created, but could not retrieve account details.",
        )

    return AuthResponse(
        access_token=create_user_token(created_user),
        user=public_user(created_user),
    )


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(data: LoginRequest):

    email = str(data.email).strip().lower()

    user = users_collection.find_one(
        {"email": email}
    )

    if not user or not verify_password(
        data.password,
        user.get("password_hash", ""),
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    return AuthResponse(
        access_token=create_user_token(user),
        user=public_user(user),
    )


# --------------------------------------------------
# RESTORE CURRENT SESSION
# GET /api/auth/me
# --------------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    return public_user(current_user)


# --------------------------------------------------
# LOGOUT
# POST /api/auth/logout
# --------------------------------------------------

@router.post(
    "/logout",
    response_model=MessageResponse,
)
async def logout(
    current_user: dict = Depends(get_current_user),
):
    return MessageResponse(
        message="Logged out successfully."
    )


# --------------------------------------------------
# VERIFY ADMINISTRATOR
# GET /api/auth/admin/me
# --------------------------------------------------

@router.get(
    "/admin/me",
    response_model=UserResponse,
)
async def get_admin_me(
    current_admin: dict = Depends(get_current_admin),
):
    return public_user(current_admin)

# --------------------------------------------------
# ADMIN: BLOCK / UNBLOCK USER
# PATCH /api/auth/admin/users/{user_id}/status
# --------------------------------------------------

@router.patch("/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    data: UpdateUserStatusRequest,
    current_admin: dict = Depends(get_current_admin),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID.",
        )

    target_user = users_collection.find_one(
        {"_id": ObjectId(user_id)}
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target_user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be blocked.",
        )

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": data.is_active,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "success": True,
        "message": (
            "User unblocked successfully."
            if data.is_active
            else "User blocked successfully."
        ),
        "user_id": user_id,
        "is_active": data.is_active,
    }
