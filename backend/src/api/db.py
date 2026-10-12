"""Persistence: every /predict lands in Postgres. Table is created on startup."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://retail:retail_dev@localhost:5432/retail"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)
Base = declarative_base()


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True)
    recency_days = Column(Float, nullable=False)
    frequency_orders = Column(Float, nullable=False)
    monetary_gbp = Column(Float, nullable=False)
    segment_id = Column(Integer, nullable=False)
    segment_name = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


def init_db() -> None:
    Base.metadata.create_all(engine)


def save_prediction(recency: float, freq: float, money: float, seg_id: int, seg_name: str) -> int:
    with Session() as s:
        row = Prediction(recency_days=recency, frequency_orders=freq,
                         monetary_gbp=money, segment_id=seg_id, segment_name=seg_name)
        s.add(row)
        s.commit()
        return row.id


def recent(limit: int = 20):
    with Session() as s:
        rows = (s.query(Prediction).order_by(Prediction.id.desc()).limit(limit).all())
        return [{"id": r.id, "recency_days": r.recency_days, "frequency_orders": r.frequency_orders,
                 "monetary_gbp": r.monetary_gbp, "segment_id": r.segment_id,
                 "segment_name": r.segment_name, "created_at": r.created_at.isoformat() if r.created_at else None}
                for r in rows]


def counts_by_segment():
    with Session() as s:
        rows = s.query(Prediction.segment_id, Prediction.segment_name,
                       func.count()).group_by(Prediction.segment_id, Prediction.segment_name).all()
        return [{"segment_id": i, "segment_name": n, "predictions": c} for i, n, c in rows]
