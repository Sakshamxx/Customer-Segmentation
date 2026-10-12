"""Line-level cleaning. Order matters: each step logs rows removed."""

import re

import pandas as pd

PRODUCT_CODE = re.compile(r"^\d{5}[A-Z]*$")


def is_product_code(code: str) -> bool:
    return bool(PRODUCT_CODE.match(str(code).strip().upper()))


def clean_lines(df_raw: pd.DataFrame):
    """Return (cleaned frame, steps table, removed non-product codes)."""
    steps = [("raw", len(df_raw))]
    df = df_raw.copy()

    # Exact duplicates carry no information
    df = df.drop_duplicates()
    steps.append(("drop_duplicates", len(df)))

    # No customer -> cannot be assigned to a segment
    df = df.dropna(subset=["CustomerID"])
    df["CustomerID"] = df["CustomerID"].astype(int)
    steps.append(("drop_missing_customer", len(df)))

    # C = cancellation, A = bad-debt adjustment; non-positive qty/price are returns or errors
    invo = df["InvoiceNo"].astype(str)
    df = df[~(invo.str.startswith("C") | invo.str.startswith("A"))]
    df = df[(df["Quantity"] > 0) & (df["UnitPrice"] > 0)]
    steps.append(("drop_cancels_adjustments_nonpositive", len(df)))

    # Service fees and vouchers are not products; rule keeps 5-digit codes
    mask_product = df["StockCode"].apply(is_product_code)
    removed_codes = (
        df.loc[~mask_product, "StockCode"].astype(str).value_counts().head(30)
    )
    df = df[mask_product]
    steps.append(("drop_non_products", len(df)))

    # Descriptions differ only by case/whitespace; fill gaps from same product
    df["Description"] = df["Description"].astype(str).str.strip().str.upper()
    df.loc[df["Description"].isin(["NAN", "NONE", ""]), "Description"] = None
    mode_per_code = df.groupby("StockCode")["Description"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else "UNKNOWN"
    )
    df["Description"] = df["Description"].fillna(df["StockCode"].map(mode_per_code))
    steps.append(("fix_descriptions", len(df)))

    df["Revenue"] = df["Quantity"] * df["UnitPrice"]
    steps_table = pd.DataFrame(steps, columns=["step", "rows_kept"])
    steps_table["rows_removed"] = steps_table["rows_kept"].shift(1, fill_value=len(df_raw)) - steps_table["rows_kept"]
    return df.reset_index(drop=True), steps_table, removed_codes
