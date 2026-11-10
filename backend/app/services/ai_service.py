import json
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / "backend" / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=API_KEY) if API_KEY else None


def _fallback_recommendations(
    goal: str,
    level: str,
    budget: float,
    resources: list,
) -> str:
    """Generate catalogue-based recommendations without Gemini."""

    affordable = [
        item
        for item in resources
        if 0 <= float(item.get("price", 0)) <= budget
    ]

    # Prefer resources relevant to the user's goal and level.
    goal_words = {
        word.lower().strip(".,!?")
        for word in goal.split()
        if len(word) > 2
    }

    def relevance_score(item):
        searchable = " ".join(
            str(item.get(field, ""))
            for field in ("title", "category", "description", "level", "type")
        ).lower()

        goal_matches = sum(word in searchable for word in goal_words)
        level_matches = int(
            str(item.get("level", "")).lower() == level.lower()
        )

        return goal_matches, level_matches

    affordable.sort(
        key=lambda item: (
            relevance_score(item),
            -float(item.get("price", 0)),
        ),
        reverse=True,
    )

    selected = []
    total = 0.0

    for item in affordable:
        price = float(item.get("price", 0))

        if total + price <= budget:
            selected.append(item)
            total += price

    return _format_recommendations(
        goal, level, budget, selected, total,
        "These recommendations are selected from your available catalogue."
    )


def _format_recommendations(
    goal: str,
    level: str,
    budget: float,
    selected: list,
    total: float,
    introduction: str,
) -> str:
    """Format recommendations using the existing Markdown response."""

    result = [
        "## Skillora Learning Recommendations",
        "",
        f"**Your goal:** {goal}",
        f"**Your level:** {level}",
        f"**Your budget:** ₹{budget:.2f}",
        "",
        introduction,
        "",
        "### Recommended resources",
    ]

    if selected:
        for index, item in enumerate(selected, start=1):
            result.extend([
                "",
                f"{index}. **{item.get('title', 'Learning resource')}**",
                f"   - ID: {item.get('id', 'N/A')}",
                f"   - Type: {item.get('type', 'Resource')}",
                f"   - Price: ₹{float(item.get('price', 0)):.2f}",
                f"   - Category: {item.get('category', 'General')}",
                f"   - Level: {item.get('level', 'All levels')}",
                f"   - Description: {item.get('description', 'No description available.')}",
            ])
    else:
        result.append("No resources in the catalogue fit your current budget.")

    result.extend([
        "",
        f"**Total bundle price:** ₹{total:.2f}",
        f"**Remaining budget:** ₹{budget - total:.2f}",
        "",
        "### Suggested learning order",
        "1. Start with the most relevant course or ebook.",
        "2. Practise what you learn.",
        "3. Complete a hands-on project to apply your knowledge.",
    ])

    return "\n".join(result)


def generate_learning_recommendations(
    goal: str,
    level: str,
    budget: float,
    resources: list,
) -> str:
    """
    Recommend products from the supplied catalogue.

    Gemini selects catalogue products when available. A local fallback
    keeps recommendations working when the API is unavailable.
    """

    if not resources:
        return _format_recommendations(
            goal, level, budget, [], 0.0,
            "Your catalogue currently contains no resources."
        )

    if client is None:
        return _fallback_recommendations(goal, level, budget, resources)

    # Send only catalogue information, not user secrets.
    catalogue = []

    for item in resources:
        try:
            price = float(item.get("price", 0))
        except (TypeError, ValueError):
            continue

        if price < 0:
            continue

        catalogue.append({
            "id": str(item.get("id", "")),
            "title": str(item.get("title", "")),
            "type": str(item.get("type", "Resource")),
            "price": price,
            "category": str(item.get("category", "General")),
            "level": str(item.get("level", "All levels")),
            "description": str(item.get("description", "")),
        })

    affordable = [
        item for item in catalogue
        if item["price"] <= budget
    ]

    if not affordable:
        return _format_recommendations(
            goal, level, budget, [], 0.0,
            "No resources in the catalogue fit your current budget."
        )

    prompt = f"""
You are Skillora AI, a learning-resource recommendation assistant.

Learner goal: {goal}
Learner level: {level}
Maximum budget: {budget} INR

Choose the most relevant resources from the supplied catalogue.
Only recommend products whose IDs occur in the catalogue below.
Never invent product IDs, titles, descriptions, or prices.
Only select products that fit the budget.
Keep the total price at or below the budget.
Choose a relevant, coherent learning bundle, not simply the cheapest products.
Prefer a sensible mix of learning material and practical projects when available.
Return ONLY valid JSON in this format:
{{
  "product_ids": ["catalogue-product-id"],
  "learning_steps": [
    "First learning step",
    "Second learning step",
    "Third learning step"
  ]
}}

Catalogue:
{json.dumps(affordable, ensure_ascii=False)}
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )

        data = json.loads(response.text or "{}")
        selected_ids = data.get("product_ids", [])

        if not isinstance(selected_ids, list):
            raise ValueError("Gemini returned invalid product IDs.")

        # Match IDs against trusted catalogue records. Never trust AI prices.
        catalogue_by_id = {
            item["id"]: item for item in affordable
        }

        selected = []
        seen_ids = set()
        total = 0.0

        for product_id in selected_ids:
            item = catalogue_by_id.get(str(product_id))

            if item is None or item["id"] in seen_ids:
                continue

            if total + item["price"] > budget:
                continue

            selected.append(item)
            seen_ids.add(item["id"])
            total += item["price"]

        if not selected:
            return _fallback_recommendations(
                goal, level, budget, resources
            )

        steps = data.get("learning_steps", [])

        result = _format_recommendations(
            goal,
            level,
            budget,
            selected,
            total,
            "These recommendations were selected by AI from your available catalogue.",
        )

        if isinstance(steps, list) and steps:
            result += "\n\n### Personalized learning roadmap\n"
            for index, step in enumerate(steps[:5], start=1):
                result += f"{index}. {str(step)}\n"

        return result

    except Exception as exc:
        # Keep the app functional if Gemini is unavailable.
        print(f"Gemini recommendation error: {exc}")
        return _fallback_recommendations(
            goal, level, budget, resources
        )
