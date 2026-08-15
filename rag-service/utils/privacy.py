import re

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}')
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d[ -]*?){13,16}\b')
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')


def redact_pii(text: str) -> str:
    """
    Sanitizes Personally Identifiable Information (PII) from input text.
    Replaces sensitive credentials with safe redaction placeholders.
    """
    if not text:
        return ""

    sanitized = text
    sanitized = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized)
    sanitized = SSN_REGEX.sub("[REDACTED_SSN]", sanitized)
    sanitized = CREDIT_CARD_REGEX.sub("[REDACTED_CARD]", sanitized)
    sanitized = PHONE_REGEX.sub("[REDACTED_PHONE]", sanitized)

    return sanitized
