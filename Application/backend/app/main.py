from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from prometheus_fastapi_instrumentator import Instrumentator

from .db import SessionLocal, init_db, AnalysisReport, AnalysisFinding
from .schemas import AnalyzeRequest, ReportOut, ReportFull
from . import ai, cache

app = FastAPI(title="LogLens AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

@app.on_event("startup")
def _startup():
    init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/healthz")
def healthz():
    return {"status": "ok", "redis": cache.ping()}

@app.post("/api/logs/analyze", response_model=ReportFull)
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    total_lines = sum(1 for l in req.logs.splitlines() if l.strip())

    cached = cache.get_cached(req.logs)
    if cached:
        analysis = cached
    else:
        try:
            analysis = ai.analyze_logs(req.logs)
        except Exception as e:
            raise HTTPException(502, f"AI analysis failed: {e}")
        cache.set_cached(req.logs, analysis)

    report = AnalysisReport(
        source_name=req.source_name,
        total_lines=total_lines,
        severity=analysis["severity"],
        summary=analysis["summary"],
        counts=analysis["counts"],
        top_patterns=analysis["top_patterns"],
        root_causes=analysis["root_causes"],
        suggested_fixes=analysis["suggested_fixes"],
        confidence=float(analysis["confidence"]),
        raw_log=req.logs[:100_000],
    )
    db.add(report)
    db.flush()
    for c in analysis["root_causes"]:
        db.add(AnalysisFinding(report_id=report.id, kind="root_cause", content=c))
    for f in analysis["suggested_fixes"]:
        db.add(AnalysisFinding(report_id=report.id, kind="suggested_fix", content=f))
    for p in analysis["top_patterns"]:
        db.add(AnalysisFinding(report_id=report.id, kind="top_pattern", content=p))
    db.commit()
    db.refresh(report)
    return _to_full(report)

@app.get("/api/reports", response_model=list[ReportOut])
def list_reports(q: str | None = None, limit: int = 50, db: Session = Depends(get_db)):
    stmt = select(AnalysisReport).order_by(AnalysisReport.created_at.desc()).limit(min(limit, 200))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(AnalysisReport.source_name.ilike(like), AnalysisReport.summary.ilike(like)))
    return [_to_out(r) for r in db.scalars(stmt).all()]

@app.get("/api/reports/{report_id}", response_model=ReportFull)
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = db.get(AnalysisReport, report_id)
    if not r:
        raise HTTPException(404, "Report not found")
    return _to_full(r)

def _to_out(r: AnalysisReport) -> ReportOut:
    return ReportOut(
        id=r.id, created_at=r.created_at, source_name=r.source_name,
        total_lines=r.total_lines, severity=r.severity, summary=r.summary,
        counts=r.counts, top_patterns=r.top_patterns, root_causes=r.root_causes,
        suggested_fixes=r.suggested_fixes, confidence=r.confidence,
    )

def _to_full(r: AnalysisReport) -> ReportFull:
    return ReportFull(**_to_out(r).model_dump(), raw_log=r.raw_log)
