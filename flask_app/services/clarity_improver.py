from flask_app.services.grok_client import GrokClient


class ClarityImprover:
    """Service for improving sentence clarity and readability using the Grok API."""

    def __init__(self):
        self.client = GrokClient()

    def improve(self, text):
        """Analyze text for clarity and suggest improvements.

        Args:
            text: The input text to improve for clarity.

        Returns:
            dict: JSON with improved_text, changes list, clarity_score, and summary.
        """
        system_prompt = """You are an expert writing clarity consultant. Analyze the given text and suggest improvements for clarity, conciseness, and readability. Return a JSON response with:
{
    "improved_text": "the rewritten text with all clarity improvements applied",
    "changes": [
        {
            "before": "the original unclear phrase or sentence",
            "after": "the improved version",
            "reason": "brief explanation of why this change improves clarity"
        }
    ],
    "clarity_score": number from 1 to 10 (1 = very unclear, 10 = crystal clear),
    "summary": "brief overall assessment of the text's clarity and what was improved"
}
Focus on:
- Eliminating wordiness and redundancy
- Simplifying complex or convoluted sentences
- Improving sentence flow and transitions
- Replacing jargon or vague language with precise alternatives
- Strengthening weak constructions (e.g., passive voice to active voice where appropriate)
- Breaking up overly long sentences
If the text is already clear and well-written, return it as improved_text with an empty changes array and a high clarity_score."""

        return self.client.chat(system_prompt, text)
