import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / "backend" / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise SystemExit("GEMINI_API_KEY is missing from backend/.env")

client = genai.Client(api_key=api_key)

models = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
]

try:
    for model in models:
        print(f"\nTesting {model}...")

        try:
            response = client.models.generate_content(
                model=model,
                contents="Reply with exactly: Skillora AI is working!",
            )

            print("SUCCESS:", response.text)

        except Exception as exc:
            print(f"FAILED: {type(exc).__name__}: {exc}")

finally:
    client.close()