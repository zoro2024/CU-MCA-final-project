import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def _uuid() -> str:
    return str(uuid.uuid4())

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    source_name: Mapped[str] = mapped_column(String(255), default="pasted-logs")
    total_lines: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[str] = mapped_column(String(16), default="low")
    summary: Mapped[str] = mapped_column(Text, default="")
    counts: Mapped[dict] = mapped_column(JSON, default=dict)
    top_patterns: Mapped[list] = mapped_column(JSON, default=list)
    root_causes: Mapped[list] = mapped_column(JSON, default=list)
    suggested_fixes: Mapped[list] = mapped_column(JSON, default=list)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    raw_log: Mapped[str] = mapped_column(Text, default="")
    findings: Mapped[list["AnalysisFinding"]] = relationship(back_populates="report", cascade="all, delete-orphan")

class AnalysisFinding(Base):
    __tablename__ = "analysis_findings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    report_id: Mapped[str] = mapped_column(ForeignKey("analysis_reports.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    report: Mapped[AnalysisReport] = relationship(back_populates="findings")

def init_db():
    Base.metadata.create_all(engine)
