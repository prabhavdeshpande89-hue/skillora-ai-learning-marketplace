import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

# Load the API key from backend/.env
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / "backend" / ".env"

load_dotenv(ENV_FILE)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise SystemExit("ERROR: GEMINI_API_KEY was not found in backend/.env")

client = genai.Client(api_key=api_key)

print("\nChecking Gemini models available to your API key...\n")

try:
    found_models = []

    for model in client.models.list():
        actions = getattr(model, "supported_actions", None) or []

        if "generateContent" in actions:
            model_name = model.name.removeprefix("models/")
            found_models.append(model_name)
            print(f"Available for text generation: {model_name}")

    if not found_models:
        print("No models supporting generateContent were returned.")
    else:
        print(f"\nTotal models found: {len(found_models)}")
        print("\nChoose a listed model for your AI Assistant.")

except Exception as exc:
    print(f"\nCould not retrieve models: {type(exc).__name__}: {exc}")

finally:
    client.close()
