import requests
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

def extract_invoice_data(raw_text: str):
    prompt = f"""
    You are an API that ONLY returns JSON.

    STRICT RULES:
    - Output MUST be valid JSON
    - NO explanation
    - NO text before or after JSON
    - NO markdown
    - NO reasoning

    If any field is missing, use:
    - vendor: "Unknown"
    - amount: 0
    - due_date: ""
    - line_items: []

    Return EXACTLY this format:

    {{
    "vendor": "string",
    "amount": number,
    "due_date": "YYYY-MM-DD",
    "line_items": [
        {{"description": "string", "amount": number}}
    ]
    }}

    Invoice text:
    {raw_text}
    """

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            # "model": "z-ai/glm-4.5-air:free",
            "model": "openai/gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "max_tokens": 900,
        }
    )

    data = response.json()

    try:
        message = data["choices"][0]["message"]

        llm_output = message.get("content")

        if not llm_output:
            llm_output = message.get("reasoning")

        return llm_output

    except Exception:
        print("❌ LLM ERROR:", data)
        raise Exception("LLM API failed")