"""Serving module: K-Means on RFM has predict(), so new customers segment live."""

from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .db import counts_by_segment, init_db, recent, save_prediction

ROOT = Path(__file__).resolve().parents[3]
_bundle = joblib.load(ROOT / "outputs" / "retail_kmeans.joblib")
_scaler = _bundle["scaler"]
_kmeans = _bundle["model"]

# Column positions inside the fitted scaler (fit on 8 cols, is_uk excluded)
RECENCY_I, FREQ_I, MONEY_I = 0, 1, 2

SEGMENTS = {
    0: {"name": "Everyday Regular", "blurb": "Bought ~2 months ago, a couple of orders, mid spend."},
    1: {"name": "VIP Loyal", "blurb": "Recent, orders ~10x, drives 83% of revenue."},
    2: {"name": "Lapsed Browser", "blurb": "Away ~8 months, one small order, needs win-back."},
}

PROFILES = [
    {"id": 0, "customers": 1983, "share": 0.46, "rev_share": 0.13,
     "recency": 54.4, "frequency": 2.0, "monetary": 568.1, **SEGMENTS[0]},
    {"id": 1, "customers": 1361, "share": 0.31, "rev_share": 0.83,
     "recency": 30.5, "frequency": 9.6, "monetary": 5298.6, **SEGMENTS[1]},
    {"id": 2, "customers": 990, "share": 0.23, "rev_share": 0.05,
     "recency": 255.0, "frequency": 1.4, "monetary": 403.4, **SEGMENTS[2]},
]


class CustomerIn(BaseModel):
    recency_days: float = Field(ge=0, le=730)
    frequency_orders: float = Field(ge=1, le=500)
    monetary_gbp: float = Field(ge=0, le=500000)


def _scale(recency: float, freq: float, money: float) -> np.ndarray:
    # Same recipe as training: log1p skewed counts/money, then RobustScaler per column
    r = (recency - _scaler.center_[RECENCY_I]) / _scaler.scale_[RECENCY_I]
    f = (np.log1p(freq) - _scaler.center_[FREQ_I]) / _scaler.scale_[FREQ_I]
    m = (np.log1p(money) - _scaler.center_[MONEY_I]) / _scaler.scale_[MONEY_I]
    return np.array([[r, f, m]])


app = FastAPI(title="Retail Segmentation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    try:
        init_db()
        db = "up"
    except Exception:
        db = "down"
    return {"ok": True, "k": int(_kmeans.n_clusters), "db": db}


@app.get("/clusters")
def clusters():
    return {"segments": PROFILES}


@app.post("/predict")
def predict(c: CustomerIn):
    x = _scale(c.recency_days, c.frequency_orders, c.monetary_gbp)
    label = int(_kmeans.predict(x)[0])
    dists = [round(float(d), 3) for d in _kmeans.transform(x)[0]]
    seg = {"id": label, **SEGMENTS[label]}
    try:
        row_id = save_prediction(c.recency_days, c.frequency_orders,
                                 c.monetary_gbp, label, SEGMENTS[label]["name"])
        stored = True
    except Exception:
        row_id, stored = None, False
    return {"segment": seg, "distances": dists,
            "profile": next(p for p in PROFILES if p["id"] == label),
            "stored": stored, "row_id": row_id}


@app.get("/history")
def history(limit: int = 20):
    return {"predictions": recent(min(limit, 100))}


@app.get("/stats")
def stats():
    return {"by_segment": counts_by_segment()}
