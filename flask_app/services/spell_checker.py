from flask_app.services.grok_client import GrokClient


class SpellChecker:
    """Service for detecting spelling and punctuation errors using the Grok API."""

    def __init__(self):
        self.client = GrokClient()

    def check(self, text):
        """Analyze text for spelling and punctuation errors and return corrections.

        Args:
            text: The input text to check for spelling and punctuation issues.

        Returns:
            dict: JSON with corrected_text, errors list, error_count, and summary.
        """
        system_prompt = """You are an expert English spelling and punctuation checker. Analyze the given text and return a JSON response with:
{
    "corrected_text": "the fully corrected text with spelling and punctuation fixed",
    "errors": [
        {
            "original": "the misspelled word or incorrect punctuation",
            "correction": "the correct spelling or punctuation",
            "explanation": "brief explanation of the correction",
            "type": "spelling or punctuation"
        }
    ],
    "error_count": number,
    "summary": "brief overall summary of spelling and punctuation issues found"
}
If the text has no spelling or punctuation errors, return the original text as corrected_text with an empty errors array and error_count of 0.
Focus exclusively on:
- Spelling mistakes (typos, misspellings, homophones used incorrectly)
- Punctuation errors (missing commas, incorrect apostrophes, semicolon misuse, missing periods, quotation mark errors)
Set the "type" field to either "spelling" or "punctuation" for each error.
Do NOT correct grammar or sentence structure — only spelling and punctuation."""

        return self.client.chat(system_prompt, text)
