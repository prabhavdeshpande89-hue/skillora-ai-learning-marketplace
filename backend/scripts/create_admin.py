import getpass
import re
import sys

from pymongo.errors import PyMongoError

from backend.app.core.security import hash_password
from backend.app.db.mongodb import database

users_collection = database["users"]


def main():
    print("\n=== Skillora Admin Account Setup ===\n")

    name = input("Enter admin name: ").strip()
    email = input("Enter admin email: ").strip().lower()
    password = getpass.getpass("Enter admin password (minimum 8 characters): ")
    confirm_password = getpass.getpass("Confirm admin password: ")

    if len(name) < 2:
        print("Error: Name must contain at least 2 characters.")
        sys.exit(1)

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        print("Error: Enter a valid email address.")
        sys.exit(1)

    if len(password) < 8:
        print("Error: Password must contain at least 8 characters.")
        sys.exit(1)

    if password != confirm_password:
        print("Error: Passwords do not match.")
        sys.exit(1)

    try:
        existing_user = users_collection.find_one({"email": email})

        if existing_user:
            print("\nAn account with this email already exists.")
            print("No changes were made.")
            print(
                "If this account should become the admin, "
                "we must verify it before changing its role."
            )
            sys.exit(1)

        admin = {
            "name": name,
            "email": email,
            "password_hash": hash_password(password),
            "role": "admin",
            "is_active": True,
        }

        result = users_collection.insert_one(admin)

        print("\nAdmin account created successfully!")
        print(f"Admin ID: {result.inserted_id}")
        print(f"Admin email: {email}")
        print("Role: admin")
        print("\nKeep your admin credentials private.")

    except PyMongoError as exc:
        print(f"MongoDB error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
