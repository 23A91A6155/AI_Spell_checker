from flask_app.services.grok_client import GrokClient


class GrammarChecker:
    """Service for detecting and correcting grammar errors using the Grok API."""

    def __init__(self):
        self.client = GrokClient()

    def check(self, text):
        """Analyze text for grammar errors and return corrections.

        Args:
            text: The input text to check for grammar issues.

        Returns:
            dict: JSON with corrected_text, errors list, error_count, and summary.
        """
        system_prompt = """You are an expert English grammar checker. Analyze the given text and return a JSON response with:
{
    "corrected_text": "the fully corrected text",
    "errors": [
        {
            "original": "the incorrect phrase",
            "correction": "the corrected phrase",
            "explanation": "brief explanation of the grammar rule",
            "type": "grammar"
        }
    ],
    "error_count": number,
    "summary": "brief overall summary of issues found"
}
If the text has no grammar errors, return the original text as corrected_text with an empty errors array and error_count of 0.
Focus exclusively on grammar issues such as subject-verb agreement, tense consistency, article usage, pronoun reference, sentence fragments, run-on sentences, and parallel structure.
Do NOT correct spelling or punctuation — only grammar."""

        return self.client.chat(system_prompt, text)
