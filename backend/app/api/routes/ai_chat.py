import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.ai_chat_service import generate_chat_response

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
    )


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=10000,
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


# --------------------------------------------------
# TEMPORARY ERROR DETECTION
# --------------------------------------------------

def is_temporary_error(exc: Exception) -> bool:
    """Identify AI service errors that may succeed on retry."""

    error_message = str(exc).upper()

    temporary_indicators = (
        "503",
        "UNAVAILABLE",
        "HIGH DEMAND",
        "429",
        "RESOURCE_EXHAUSTED",
        "RATE LIMIT",
        "500",
        "INTERNAL SERVER ERROR",
        "502",
        "504",
        "DEADLINE EXCEEDED",
        "TIMED OUT",
        "TIMEOUT",
        "CONNECTION ERROR",
        "CONNECTION RESET",
    )

    return any(
        indicator in error_message
        for indicator in temporary_indicators
    )


# --------------------------------------------------
# AI RESPONSE WITH RETRY
# --------------------------------------------------

def generate_with_retry(
    message: str,
    history: list[dict],
) -> str:
    """
    Generate an AI response.

    Retry temporary service errors up to three times.
    """

    max_attempts = 3

    for attempt in range(max_attempts):
        try:
            answer = generate_chat_response(
                message=message,
                history=history,
            )

            if not isinstance(answer, str) or not answer.strip():
                raise RuntimeError(
                    "The AI service returned an empty response."
                )

            return answer.strip()

        except Exception as exc:

            if not is_temporary_error(exc):
                raise

            if attempt == max_attempts - 1:
                print(
                    f"AI service failed after "
                    f"{max_attempts} attempts: {exc}"
                )

                raise RuntimeError(
                    "The AI service is temporarily busy. "
                    "Please try again in a little while."
                ) from exc

            wait_seconds = 2 ** attempt

            print(
                f"Temporary AI service error. "
                f"Retrying in {wait_seconds} seconds "
                f"(attempt {attempt + 1}/{max_attempts})."
            )

            time.sleep(wait_seconds)

    raise RuntimeError(
        "The AI service is temporarily unavailable."
    )


# --------------------------------------------------
# CHAT ENDPOINT
# POST /api/ai/chat
# --------------------------------------------------

@router.post("/chat")
def chat_with_ai(request: ChatRequest):

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    # Convert conversation history into dictionaries.
    history = [
        item.model_dump()
        for item in request.history
    ]

    try:
        # IMPORTANT:
        # Use generate_with_retry instead of calling
        # generate_chat_response directly.
        answer = generate_with_retry(
            message=message,
            history=history,
        )

        return {
            "reply": answer,
        }

    except RuntimeError as exc:

        print(f"AI Assistant runtime error: {exc}")

        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(f"AI Assistant unexpected error: {repr(exc)}")

        raise HTTPException(
            status_code=502,
            detail=(
                "The AI Assistant is temporarily unavailable. "
                "Please try again."
            ),
        ) from exc
