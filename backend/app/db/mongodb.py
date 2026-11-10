import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = BASE_DIR / "backend" / ".env"

load_dotenv(ENV_FILE)

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "skillora_db")

if not MONGODB_URL:
    raise RuntimeError(
        f"MONGODB_URL is missing. Check your environment file: {ENV_FILE}"
    )

client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=10000,
)

database = client[MONGODB_DATABASE]
products_collection = database["products"]


def check_mongodb_connection():
    try:
        client.admin.command("ping")
        return True
    except PyMongoError as exc:
        print(f"MongoDB connection error: {exc}")
        return False