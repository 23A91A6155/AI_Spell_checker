from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_app.config import Config
from flask_app.services.grammar_checker import GrammarChecker
from flask_app.services.spell_checker import SpellChecker
from flask_app.services.clarity_improver import ClarityImprover
from flask_app.services.readability_analyzer import ReadabilityAnalyzer
import requests

app = Flask(__name__)
CORS(app)

# Initialize service instances
grammar_checker = GrammarChecker()
spell_checker = SpellChecker()
clarity_improver = ClarityImprover()
readability_analyzer = ReadabilityAnalyzer()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the Flask API is running."""
    return jsonify({
        "status": "healthy",
        "service": "AI Grammar & Spell Checker API",
        "model": Config.GROK_MODEL,
    })


# ---------------------------------------------------------------------------
# Individual check endpoints
# ---------------------------------------------------------------------------

@app.route('/api/check-grammar', methods=['POST'])
def check_grammar():
    """Check text for grammar errors."""
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({"error": "No text provided"}), 400

    result = grammar_checker.check(data['text'])

    if "error" not in result:
        save_to_history(data['text'], result, 'grammar')

    return jsonify(result)


@app.route('/api/check-spelling', methods=['POST'])
def check_spelling():
    """Check text for spelling and punctuation errors."""
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({"error": "No text provided"}), 400

    result = spell_checker.check(data['text'])

    if "error" not in result:
        save_to_history(data['text'], result, 'spelling')

    return jsonify(result)


@app.route('/api/improve-clarity', methods=['POST'])
def improve_clarity():
    """Improve text clarity and conciseness."""
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({"error": "No text provided"}), 400

    result = clarity_improver.improve(data['text'])

    if "error" not in result:
        save_to_history(data['text'], result, 'clarity')

    return jsonify(result)


@app.route('/api/readability', methods=['POST'])
def analyze_readability():
    """Analyze text readability with Flesch-Kincaid metrics and AI suggestions."""
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({"error": "No text provided"}), 400

    result = readability_analyzer.analyze(data['text'])

    if "error" not in result:
        save_to_history(data['text'], result, 'readability')

    return jsonify(result)


# ---------------------------------------------------------------------------
# Full combined check
# ---------------------------------------------------------------------------

@app.route('/api/full-check', methods=['POST'])
def full_check():
    """Run all four checks (grammar, spelling, clarity, readability) on the text."""
    data = request.get_json()
    if not data or not data.get('text', '').strip():
        return jsonify({"error": "No text provided"}), 400

    text = data['text']

    grammar_result = grammar_checker.check(text)
    spelling_result = spell_checker.check(text)
    clarity_result = clarity_improver.improve(text)
    readability_result = readability_analyzer.analyze(text)

    combined = {
        "original_text": text,
        "grammar": grammar_result,
        "spelling": spelling_result,
        "clarity": clarity_result,
        "readability": readability_result,
    }

    # Compute aggregate error count from grammar + spelling
    total_errors = 0
    if "error" not in grammar_result:
        total_errors += grammar_result.get("error_count", 0)
    if "error" not in spelling_result:
        total_errors += spelling_result.get("error_count", 0)

    combined["total_errors"] = total_errors

    # Save the full-check result to history
    save_to_history(
        text,
        {
            "corrected_text": grammar_result.get("corrected_text", text),
            "error_count": total_errors,
            "errors": (
                grammar_result.get("errors", [])
                + spelling_result.get("errors", [])
            ),
            "readability_score": readability_result.get("readability_score"),
        },
        'full',
    )

    return jsonify(combined)


# ---------------------------------------------------------------------------
# Helper: persist check results to Django backend
# ---------------------------------------------------------------------------

def save_to_history(original_text, result, check_type):
    """Save a check result to the Django backend history API.

    Silently fails if the Django service is unavailable so the Flask API
    remains functional even without the persistence layer.
    """
    try:
        requests.post(
            f"{Config.DJANGO_API_URL}/history/",
            json={
                "original_text": original_text,
                "corrected_text": result.get("corrected_text", result.get("improved_text", "")),
                "check_type": check_type,
                "errors_found": result.get("error_count", 0),
                "corrections": result.get("errors", result.get("changes", [])),
                "readability_score": result.get("readability_score", None),
            },
            timeout=5,
        )
    except Exception:
        pass  # Don't fail if Django is down


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    app.run(port=Config.FLASK_PORT, debug=Config.DEBUG)
