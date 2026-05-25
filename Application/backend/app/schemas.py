from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

class AnalyzeRequest(BaseModel):
    source_name: str = Field("pasted-logs", max_length=255)
    logs: str = Field(..., min_length=1, max_length=500_000)

class Counts(BaseModel):
    info: int = 0
    warning: int = 0
    error: int = 0

class ReportOut(BaseModel):
    id: str
    created_at: datetime
    source_name: str
    total_lines: int
    severity: Literal["low", "medium", "high", "critical"]
    summary: str
    counts: Counts
    top_patterns: list[str]
    root_causes: list[str]
    suggested_fixes: list[str]
    confidence: float

class ReportFull(ReportOut):
    raw_log: str
