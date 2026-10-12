import re

MAX_LEN = 1000
INJECTION = re.compile(r"ignore (all |previous )?instructions|system prompt|reveal.*(key|prompt)", re.I)
PII = {
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"),
    "phone": re.compile(r"\+?\d[\d\s().-]{8,}\d"),
}

def check_input(q: str) -> str:
    if not q.strip() or len(q) > MAX_LEN:
        raise ValueError("Invalid question length")
    if INJECTION.search(q):
        raise ValueError("Request blocked")
    return q

def redact(text: str) -> str:
    for name, rx in PII.items():
        text = rx.sub(f"[{name} removed]", text)
    return text