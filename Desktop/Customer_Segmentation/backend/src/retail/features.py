"""Customer-level features: RFM core plus behavioural extras."""

import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler

SKEWED = [
    "Frequency",
    "Monetary",
    "avg_order_value",
    "avg_items_per_invoice",
    "n_unique_products",
    "tenure_days",
]


def build_customer_frame(df_lines: pd.DataFrame):
    # Anchor to the data, not today, so recency is reproducible
    ref_date = df_lines["InvoiceDate"].max() + pd.Timedelta(days=1)

    items_per_invoice = df_lines.groupby(["CustomerID", "InvoiceNo"])["Quantity"].sum()

    grouped = df_lines.groupby("CustomerID")
    features = pd.DataFrame(
        {
            "Recency": (ref_date - grouped["InvoiceDate"].max()).dt.days,
            "Frequency": grouped["InvoiceNo"].nunique(),
            "Monetary": grouped["Revenue"].sum(),
            "avg_order_value": grouped["Revenue"].sum() / grouped["InvoiceNo"].nunique(),
            "avg_items_per_invoice": items_per_invoice.groupby("CustomerID").mean(),
            "n_unique_products": grouped["StockCode"].nunique(),
            "tenure_days": (grouped["InvoiceDate"].max() - grouped["InvoiceDate"].min()).dt.days,
            "is_uk": (grouped["Country"].agg(lambda s: s.mode().iloc[0]) == "United Kingdom").astype(int),
        }
    )
    # Single-purchase customers have no repeat interval
    features["avg_days_between"] = features["tenure_days"] / features["Frequency"].clip(lower=1)
    return features, ref_date


def log_and_scale(feature_frame: pd.DataFrame):
    """Log skewed counts/money, then scale robustly to wholesale outliers."""
    logged = feature_frame.copy()
    for col in SKEWED:
        if col in logged.columns:
            logged[col] = np.log1p(logged[col])

    scaler = RobustScaler()  # median/IQR: wholesale giants don't drag the centre
    cols = [c for c in logged.columns if c != "is_uk"]
    scaled = logged.copy()
    scaled[cols] = scaler.fit_transform(logged[cols])
    return scaled, scaler


def prune_correlated(scaled: pd.DataFrame, limit: float = 0.9):
    corr = scaled.corr().abs()
    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
    dropped = [c for c in upper.columns if (upper[c] >= limit).any()]
    return scaled.drop(columns=dropped), dropped, scaled.corr()


def feature_sets(scaled_full: pd.DataFrame):
    core = ["Recency", "Frequency", "Monetary"]
    return {"A_rfm": scaled_full[core], "B_extended": scaled_full}
