
import os
import certifi
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / "backend" / ".env"

load_dotenv(ENV_PATH)

MONGO_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("MONGODB_DATABASE")

if not MONGO_URL:
    raise ValueError("MONGODB_URL not found in backend/.env")

try:
    client = MongoClient(
        MONGO_URL,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=15000,
    )

    client.admin.command("ping")

    print("MongoDB Atlas connected successfully!")
    print("Database:", DATABASE_NAME)

except Exception as e:
    print("MongoDB connection failed:")
    print(e)

finally:
    if "client" in locals():
        client.close()
