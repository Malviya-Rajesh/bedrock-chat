"""
Text filtering utilities for production-ready responses.
"""

import re
import logging

logger = logging.getLogger(__name__)


def remove_thinking_content(text: str) -> str:
    """
    Remove <thinking> content from text for production use.

    This function filters out internal reasoning content that should not be
    exposed to end users in production environments.

    Args:
        text: The input text that may contain <thinking> tags

    Returns:
        The cleaned text with <thinking> content removed
    """
    if not text:
        return text

    # Remove <thinking>...</thinking> blocks (case insensitive, multiline)
    # This regex handles:
    # - Case insensitive tags
    # - Multiline content
    # - Nested content within thinking blocks
    # - Potential malformed tags
    cleaned_text = re.sub(
        r'<thinking>.*?</thinking>',
        '',
        text,
        flags=re.IGNORECASE | re.DOTALL
    )

    # Also remove any orphaned opening or closing thinking tags
    cleaned_text = re.sub(
        r'</?thinking>', '', cleaned_text, flags=re.IGNORECASE
    )

    # Clean up any excessive whitespace that may result from removing content
    cleaned_text = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned_text)
    cleaned_text = cleaned_text.strip()

    # Log if thinking content was found and removed (for debugging)
    if text != cleaned_text:
        original_len = len(text)
        cleaned_len = len(cleaned_text)
        logger.debug(
            f"Removed thinking content from text "
            f"(original length: {original_len}, cleaned length: {cleaned_len})"
        )

    return cleaned_text


def should_filter_thinking_content() -> bool:
    """
    Determine if thinking content should be filtered out.

    In production environments, thinking content should always be filtered.
    This function provides a centralized way to control this behavior.

    Returns:
        True if thinking content should be filtered, False otherwise
    """
    # Always filter thinking content for production use
    # This could be made configurable via environment variables if needed
    return True
