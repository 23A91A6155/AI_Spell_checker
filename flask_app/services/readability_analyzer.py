import re
from flask_app.services.grok_client import GrokClient


def count_syllables(word):
    """Count the number of syllables in a word using a heuristic approach.

    Args:
        word: A single word string.

    Returns:
        int: Estimated syllable count (minimum 1).
    """
    word = word.lower().strip()
    if not word:
        return 0

    # Remove trailing 'e' (silent e)
    if word.endswith('e') and len(word) > 2:
        word = word[:-1]

    # Count vowel groups
    vowel_groups = re.findall(r'[aeiouy]+', word)
    count = len(vowel_groups)

    # Every word has at least one syllable
    return max(1, count)


def calculate_flesch_kincaid(text):
    """Calculate Flesch-Kincaid readability metrics for the given text.

    Args:
        text: The input text to analyze.

    Returns:
        dict: Contains readability_score, grade_level, word_count,
              sentence_count, avg_sentence_length, and syllable_count.
    """
    # Split into sentences (by period, exclamation, question mark)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = max(1, len(sentences))

    # Split into words
    words = re.findall(r'[a-zA-Z\']+', text)
    word_count = max(1, len(words))

    # Count total syllables
    syllable_count = sum(count_syllables(w) for w in words)

    # Flesch Reading Ease score
    avg_sentence_length = word_count / sentence_count
    avg_syllables_per_word = syllable_count / word_count

    reading_ease = (
        206.835
        - (1.015 * avg_sentence_length)
        - (84.6 * avg_syllables_per_word)
    )
    reading_ease = round(max(0, min(100, reading_ease)), 2)

    # Flesch-Kincaid Grade Level
    grade_level = (
        (0.39 * avg_sentence_length)
        + (11.8 * avg_syllables_per_word)
        - 15.59
    )
    grade_level = round(max(0, grade_level), 2)

    return {
        "readability_score": reading_ease,
        "grade_level": grade_level,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": round(avg_sentence_length, 2),
        "syllable_count": syllable_count,
    }


class ReadabilityAnalyzer:
    """Service combining local Flesch-Kincaid computation with Grok-powered suggestions."""

    def __init__(self):
        self.client = GrokClient()

    def analyze(self, text):
        """Perform readability analysis on the given text.

        Combines local Flesch-Kincaid metrics with AI-generated improvement suggestions.

        Args:
            text: The input text to analyze.

        Returns:
            dict: Readability metrics merged with AI suggestions.
        """
        # Step 1: Local computation of readability metrics
        metrics = calculate_flesch_kincaid(text)

        # Step 2: Get AI-powered suggestions for improvement
        system_prompt = f"""You are an expert readability analyst. The user's text has the following computed readability metrics:
- Flesch Reading Ease Score: {metrics['readability_score']} (0-100, higher = easier to read)
- Flesch-Kincaid Grade Level: {metrics['grade_level']}
- Word Count: {metrics['word_count']}
- Sentence Count: {metrics['sentence_count']}
- Average Sentence Length: {metrics['avg_sentence_length']} words

Based on these metrics and the text itself, provide suggestions to improve readability. Return a JSON response with:
{{
    "suggestions": [
        {{
            "issue": "description of the readability issue",
            "recommendation": "specific actionable recommendation",
            "priority": "high, medium, or low"
        }}
    ],
    "overall_assessment": "brief paragraph summarizing the text's readability level and target audience",
    "target_audience": "estimated reading audience (e.g., general public, college level, professional)"
}}
Provide 3-6 specific, actionable suggestions. Focus on sentence length variation, vocabulary complexity, paragraph structure, and overall flow."""

        ai_result = self.client.chat(system_prompt, text)

        # Step 3: Merge local metrics with AI suggestions
        result = {**metrics}

        if "error" not in ai_result:
            result["suggestions"] = ai_result.get("suggestions", [])
            result["overall_assessment"] = ai_result.get("overall_assessment", "")
            result["target_audience"] = ai_result.get("target_audience", "")
        else:
            result["suggestions"] = []
            result["overall_assessment"] = "AI analysis unavailable."
            result["target_audience"] = "unknown"
            result["ai_error"] = ai_result.get("error", "Unknown error")

        return result
