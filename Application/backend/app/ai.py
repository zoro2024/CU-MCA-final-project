"""AI provider abstraction. Uses Google Gemini via the OpenAI-compatible API.

Free API key: https://aistudio.google.com/apikey
The OpenAI SDK is reused — only base_url + key + model change, so swapping in
OpenAI, Groq, Ollama, or Lovable AI Gateway later is a one-line change.
"""
import json
from typing import Literal, TypedDict
from openai import OpenAI
from .config import settings

class Counts(TypedDict):
    info: int
    warning: int
    error: int

class Analysis(TypedDict):
    summary: str
    severity: Literal["low", "medium", "high", "critical"]
    counts: Counts
    top_patterns: list[str]
    root_causes: list[str]
    suggested_fixes: list[str]
    confidence: float

_SYSTEM = (
    "You are an expert SRE analyzing application and Kubernetes logs. "
    "Produce a concise, accurate structured analysis. "
    "Severity: low=info noise, medium=warnings, high=errors but running, "
    "critical=crashes/OOM/data-loss. Confidence is 0..1."
)

_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
        "counts": {
            "type": "object",
            "properties": {
                "info": {"type": "integer"},
                "warning": {"type": "integer"},
                "error": {"type": "integer"},
            },
            "required": ["info", "warning", "error"],
        },
        "top_patterns": {"type": "array", "items": {"type": "string"}},
        "root_causes": {"type": "array", "items": {"type": "string"}},
        "suggested_fixes": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number"},
    },
    "required": ["summary", "severity", "counts", "top_patterns", "root_causes", "suggested_fixes", "confidence"],
}

def _truncate(text: str, head: int = 400, tail: int = 400) -> str:
    lines = text.splitlines()
    if len(lines) <= head + tail:
        return text
    return "\n".join(lines[:head] + [f"... [{len(lines)-head-tail} lines truncated] ..."] + lines[-tail:])

def analyze_logs(text: str) -> Analysis:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured. Get a free key at https://aistudio.google.com/apikey")
    client = OpenAI(api_key=settings.gemini_api_key, base_url=settings.gemini_base_url)
    payload = _truncate(text)
    resp = client.chat.completions.create(
        model=settings.gemini_model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": f"Analyze these logs:\n\n{payload}"},
        ],
        tools=[{"type": "function", "function": {
            "name": "report_log_analysis",
            "description": "Return the structured log analysis",
            "parameters": _SCHEMA,
        }}],
        tool_choice={"type": "function", "function": {"name": "report_log_analysis"}},
    )
    call = resp.choices[0].message.tool_calls[0]
    return json.loads(call.function.arguments)
