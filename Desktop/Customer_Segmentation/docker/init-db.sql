-- Runs once, on first container init (empty volume only).
-- Backend also creates this table on startup, so both paths agree.
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    recency_days DOUBLE PRECISION NOT NULL,
    frequency_orders DOUBLE PRECISION NOT NULL,
    monetary_gbp DOUBLE PRECISION NOT NULL,
    segment_id INTEGER NOT NULL,
    segment_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictions_segment ON predictions (segment_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions (created_at);
