from openai import OpenAI
from flask_app.config import Config
import json


class GrokClient:
    """Client for communicating with the Grok API (xAI) via OpenAI-compatible interface."""

    def __init__(self):
        self.client = OpenAI(
            api_key=Config.XAI_API_KEY,
            base_url=Config.XAI_BASE_URL,
        )
        self.model = Config.GROK_MODEL

    def chat(self, system_prompt, user_message, temperature=0.2):
        """Send a chat completion request to the Grok API.

        Args:
            system_prompt: The system-level instruction for the model.
            user_message: The user's input text to process.
            temperature: Sampling temperature (default 0.2 for deterministic output).

        Returns:
            dict: Parsed JSON response from the model, or an error dict.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "Failed to parse API response", "raw": content}
        except Exception as e:
            return {"error": str(e)}
