import json
import re

def safe_parse_llm_output(text: str):
    try:
        if not text:
            print("⚠️ Empty LLM response")
            return fallback()

        text = text.strip()
        text = text.replace("```json", "").replace("```", "").strip()

        match = re.search(r'\{.*\}', text, re.DOTALL)

        if not match:
            print("⚠️ No JSON found")
            print("RAW OUTPUT:", text)
            return fallback()

        return json.loads(match.group())

    except Exception as e:
        print("⚠️ Parsing failed:", e)
        return fallback()


def fallback():
    return {
        "vendor": "Unknown",
        "amount": 0,
        "due_date": "",
        "line_items": []
    }