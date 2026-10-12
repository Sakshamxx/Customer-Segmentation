"""Shared paths and raw-data loading. Single place for location logic."""

from pathlib import Path


def project_root() -> Path:
    # retail/ -> src/ -> backend/ -> project root
    return Path(__file__).resolve().parents[3]


def data_path() -> Path:
    root = project_root()
    for name in ("Online_Retail.xlsx", "Online Retail.xlsx"):
        candidate = root / "data" / name
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Place the workbook at data/Online_Retail.xlsx")


def outputs_dir() -> Path:
    out = project_root() / "outputs"
    out.mkdir(parents=True, exist_ok=True)
    return out


def figures_dir() -> Path:
    figs = outputs_dir() / "figures"
    figs.mkdir(parents=True, exist_ok=True)
    return figs


def cleaned_cache_path() -> Path:
    return outputs_dir() / "cleaned_lines.pkl"


def load_raw():
    import pandas as pd

    # Slow (~1 min): callers should prefer the cleaned cache after first run
    return pd.read_excel(data_path(), engine="openpyxl")
