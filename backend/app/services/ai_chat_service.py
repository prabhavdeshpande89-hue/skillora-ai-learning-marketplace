import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

# --------------------------------------------------
# ENVIRONMENT CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[3]

load_dotenv(BASE_DIR / "backend" / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

# Primary Gemini model
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash",
)

# Fallback Gemini model
GEMINI_FALLBACK_MODEL = os.getenv(
    "GEMINI_FALLBACK_MODEL",
    "gemini-3.5-flash",
)

# Allow output token limit to be configured through .env
try:
    MAX_OUTPUT_TOKENS = int(
        os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "8192")
    )
except ValueError as exc:
    raise RuntimeError(
        "GEMINI_MAX_OUTPUT_TOKENS must be a valid integer."
    ) from exc

if MAX_OUTPUT_TOKENS <= 0:
    raise RuntimeError(
        "GEMINI_MAX_OUTPUT_TOKENS must be greater than zero."
    )

# Initialize Gemini client
client = (
    genai.Client(
        api_key=API_KEY,
        http_options={
            "timeout": 120000,
        },
    )
    if API_KEY
    else None
)


# --------------------------------------------------
# SYSTEM INSTRUCTION
# --------------------------------------------------

SYSTEM_INSTRUCTION = """
You are Skillora AI Assistant, a helpful and intelligent
general-purpose AI chatbot.

Your goal is to provide accurate, useful, complete and
well-structured answers.

You can help with:

- Programming, Python, JavaScript and computer science.
- Artificial intelligence and machine learning.
- Data science, analytics and statistics.
- Web development and debugging.
- Backend and frontend development.
- Database management and cloud computing.
- Academic subjects and technical concepts.
- Projects, assignments and practical implementation.
- Career guidance and interview preparation.
- General knowledge and everyday questions.

RESPONSE GUIDELINES:

1. Understand the user's question before answering.

2. Provide complete answers. Do not stop in the middle
   of a sentence, paragraph, heading or explanation.

3. For detailed questions, organize answers using:
   - Clear headings
   - Bullet points
   - Numbered steps
   - Examples where useful

4. Explain difficult technical concepts in simple language.

5. When providing code, provide properly formatted,
   complete and usable code whenever requested.

6. For debugging, explain the cause of the issue and
   provide practical solutions.

7. Adapt the length of your response to the question.
   Keep simple answers concise and detailed answers
   sufficiently comprehensive.

8. Do not unnecessarily repeat information.

9. Do not invent facts, sources, test results or capabilities.

10. Do not claim to have executed code or accessed systems
    unless you actually have.

11. Do not restrict answers to Skillora courses or products.

12. If you cannot answer something confidently, say so.

Always aim to finish your response naturally and completely.
"""


# --------------------------------------------------
# TEMPORARY ERROR DETECTION
# --------------------------------------------------

TEMPORARY_ERROR_INDICATORS = (
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
    "DEADLINE_EXCEEDED",
    "TIMED OUT",
    "TIMEOUT",
    "CONNECTION ERROR",
    "CONNECTION RESET",
)


def is_temporary_error(exc: Exception) -> bool:
    error_message = str(exc).upper()

    return any(
        indicator in error_message
        for indicator in TEMPORARY_ERROR_INDICATORS
    )


# --------------------------------------------------
# CONVERSATION HISTORY
# --------------------------------------------------

def build_conversation(
    message: str,
    history: list | None = None,
) -> list:

    conversation = []

    # Keep the latest 10 valid conversation messages.
    for item in (history or [])[-10:]:

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content", "")

        if role not in ("user", "assistant"):
            continue

        if not isinstance(content, str):
            continue

        content = content.strip()

        if not content:
            continue

        conversation.append(
            {
                "role": (
                    "user"
                    if role == "user"
                    else "model"
                ),
                "parts": [
                    {
                        "text": content
                    }
                ],
            }
        )

    # Add the latest user message.
    conversation.append(
        {
            "role": "user",
            "parts": [
                {
                    "text": message.strip()
                }
            ],
        }
    )

    return conversation


# --------------------------------------------------
# GENERATE RESPONSE USING A SPECIFIC MODEL
# --------------------------------------------------

def _generate_with_model(
    model: str,
    conversation: list,
) -> str:

    response = client.models.generate_content(
        model=model,
        contents=conversation,
        config={
            "system_instruction": SYSTEM_INSTRUCTION,
            "max_output_tokens": MAX_OUTPUT_TOKENS,
        },
    )

    # Check whether Gemini returned any candidates.
    if not response.candidates:
        raise RuntimeError(
            f"Gemini model {model} returned no response candidates."
        )

    candidate = response.candidates[0]

    # Check the response completion reason.
    finish_reason = candidate.finish_reason

    if finish_reason is not None:
        finish_reason_text = str(finish_reason).upper()

        if "MAX_TOKENS" in finish_reason_text:
            print(
                f"Warning: Gemini model {model} reached "
                f"the output token limit of {MAX_OUTPUT_TOKENS}."
            )

    # Extract generated text.
    answer = response.text

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError(
            f"Gemini model {model} returned an empty response."
        )

    return answer.strip()


# --------------------------------------------------
# MAIN AI RESPONSE GENERATOR
# --------------------------------------------------

def generate_chat_response(
    message: str,
    history: list | None = None,
) -> str:

    if client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from backend/.env"
        )

    if not isinstance(message, str) or not message.strip():
        raise ValueError(
            "Message cannot be empty."
        )

    conversation = build_conversation(
        message=message,
        history=history,
    )

    # Try primary model first, then fallback model.
    models_to_try = list(
        dict.fromkeys(
            [
                GEMINI_MODEL,
                GEMINI_FALLBACK_MODEL,
            ]
        )
    )

    last_error = None

    for index, model in enumerate(models_to_try):

        try:
            print(
                f"Skillora AI: Generating response using {model}"
            )

            answer = _generate_with_model(
                model=model,
                conversation=conversation,
            )

            if index > 0:
                print(
                    f"Skillora AI successfully used fallback model: {model}"
                )

            print(
                f"Skillora AI generated {len(answer)} characters."
            )

            return answer

        except Exception as exc:

            last_error = exc

            print(
                f"Gemini model {model} failed: "
                f"{type(exc).__name__}: {exc}"
            )

            # Only switch models for temporary errors.
            if not is_temporary_error(exc):
                raise

            if index < len(models_to_try) - 1:
                print(
                    "Primary Gemini model is temporarily unavailable. "
                    f"Switching to fallback model: "
                    f"{GEMINI_FALLBACK_MODEL}"
                )

    raise RuntimeError(
        "Skillora AI is temporarily unavailable. "
        "Please try again shortly."
    ) from last_error
