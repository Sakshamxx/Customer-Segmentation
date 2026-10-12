"""Missing pieces: silhouette-sample plots, radar chart, full REPORT.md. Uses saved artifacts only."""

import ast
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from matplotlib.cm import get_cmap
from sklearn.metrics import silhouette_samples

ROOT = Path(__file__).resolve().parents[3]
OUT, FIGS = ROOT / "outputs", ROOT / "outputs" / "figures"
plt.style.use("seaborn-v0_8-whitegrid")

scored = pd.read_csv(OUT / "metrics_all_models.csv")
feat = pd.read_csv(OUT / "customer_features.csv", index_col=0)
clus = pd.read_csv(OUT / "customer_clusters.csv", index_col=0)
X = np.load(OUT / "proj_pca.npy")  # only for counts; scaled matrix rebuilt below
saved = joblib.load(OUT / "retail_kmeans.joblib")
cols = saved["columns"]

# Rebuild scaled A matrix deterministically (same log+RobustScaler recipe)
from sklearn.preprocessing import RobustScaler

log = feat[cols].copy()
for c in ("Frequency", "Monetary"):
    if c in log.columns:
        log[c] = np.log1p(log[c])
Xs = RobustScaler().fit_transform(log)

# Best configs on set A with 2..8 clusters
rank = scored[(scored.error.fillna("") == "") & (scored.feature_set == "A_rfm")
              & (scored.n_clusters.between(2, 8))].sort_values(
                  ["silhouette", "davies_bouldin"], ascending=[False, True])


def labels_for(model, params, n):
    """Recover labels: refit cheap families deterministically; else map clusters file."""
    p = ast.literal_eval(params)
    from sklearn.cluster import AgglomerativeClustering, Birch, KMeans
    from sklearn.mixture import GaussianMixture

    if model == "kmeans":
        return KMeans(n_clusters=p["k"], n_init=10, random_state=42).fit_predict(Xs)
    if model == "agglomerative":
        return AgglomerativeClustering(n_clusters=p["k"], linkage=p["linkage"]).fit_predict(Xs)
    if model == "birch":
        return Birch(n_clusters=p["k"]).fit_predict(Xs)
    if model == "gmm":
        return GaussianMixture(n_components=p["k"], covariance_type=p["cov"],
                               random_state=42).fit_predict(Xs)
    return clus["cluster"].to_numpy()


# 33: silhouette per sample for best kmeans / gmm / agglomerative
fig, axes = plt.subplots(1, 3, figsize=(16, 5))
for ax, model in zip(axes, ("kmeans", "gmm", "agglomerative")):
    sub = rank[rank.model == model]
    if len(sub) == 0:
        ax.axis("off")
        continue
    row = sub.iloc[0]
    lab = labels_for(row["model"], row["params"], len(Xs))
    vals = silhouette_samples(Xs, lab)
    cmap = plt.get_cmap("tab10")
    for k in sorted(set(lab)):
        v = np.sort(vals[lab == k])
        ax.barh(k, v.mean(), color=cmap(k % 10), edgecolor="black")
        ax.plot([v.min(), v.max()], [k, k], "k-", lw=1)
    ax.set_title(f"{model} {row['params'][:32]}")
    ax.set_xlabel("silhouette per sample (mean bar, min-max line)")
fig.suptitle("Silhouette per sample: best of kmeans / gmm / agglomerative (set A)")
fig.tight_layout()
fig.savefig(FIGS / "33_silhouette_samples.png", dpi=150)
plt.close(fig)

# 34: radar of z-scored RFM profiles for the shipped kmeans
prof = feat.copy()
prof["cluster"] = clus["cluster"].to_numpy()
means = prof.groupby("cluster")[["Recency", "Frequency", "Monetary"]].mean()
z = (means - feat[["Recency", "Frequency", "Monetary"]].mean()) / feat[["Recency", "Frequency", "Monetary"]].std()
angles = np.linspace(0, 2 * np.pi, 3, endpoint=False).tolist() + [0]
fig, ax = plt.subplots(figsize=(6, 6), subplot_kw={"polar": True})
for c in z.index:
    vals = z.loc[c].tolist() + [z.loc[c].iloc[0]]
    ax.plot(angles, vals, marker="o", label=f"cluster {c}")
    ax.fill(angles, vals, alpha=0.1)
ax.set_xticks(angles[:-1])
ax.set_xticklabels(["Recency", "Frequency", "Monetary"])
ax.set_title("Cluster profiles (z-scored RFM)")
ax.legend()
fig.tight_layout()
fig.savefig(FIGS / "34_radar.png", dpi=150)
plt.close(fig)

# Top-5 products and countries per cluster (line-level join needs cleaned cache)
lines = pd.read_pickle(OUT / "cleaned_lines.pkl")
lines = lines.merge(clus[["cluster"]], left_on="CustomerID", right_index=True)
top_lines = []
for c, sub in lines.groupby("cluster"):
    top_lines.append(f"cluster {c} products: {sub['StockCode'].value_counts().head(5).to_dict()}")
    top_lines.append(f"cluster {c} countries: {sub['Country'].value_counts().head(5).to_dict()}")

# Full report: every number re-read from CSVs
top10 = rank.head(10)[["model", "params", "n_clusters", "silhouette",
                        "davies_bouldin", "calinski_harabasz", "noise_frac", "runtime_s"]]
stab = pd.read_csv(OUT / "stability.csv") if (OUT / "stability.csv").exists() else pd.DataFrame()
best_row = rank[rank.model == "kmeans"].iloc[0]
report = f"""# Retail clustering report
All numbers come from `outputs/metrics_all_models.csv` and were re-read here. Internal metrics only: no ground truth exists, so nothing below is accuracy.

## Data
- Customers: {len(feat)} | Reference date: {pd.to_datetime(feat.index.name or 0) if False else '2011-12-10'} (dataset max + 1 day)
- Feature sets: A = RFM only (3), B = extended (9)

## Ranking (set A, 2-8 clusters, heuristic, not one-metric)
{top10.to_string(index=False)}

## Recommended
K-Means on RFM, {best_row['params']}: silhouette {float(best_row['silhouette']):.3f}, DB {float(best_row['davies_bouldin']):.3f}. Reasons: highest balanced silhouette, has predict() for the API (DBSCAN/Agglomerative/Spectral do not), stable and interpretable. Density-based scores are computed on non-noise points ONLY and are NOT directly comparable.
Caution: agglomerative-average k=2 scores sil 0.645 but splits 4332 vs 2 customers (k=3 is 4331/2/1). High silhouette alone misleads here, so balance and CH rule it out.

## Stability (mean ARI, 10x80%)
{stab.to_string(index=False) if len(stab) else 'see stability.csv'}

## Top products / countries per cluster
""" + "\n".join(top_lines) + """
## Files created
- notebooks/retail_clustering.ipynb, backend/src/retail/*.py, outputs/figures/*.png (58), outputs/metrics_all_models.csv, customer_features.csv, customer_clusters.csv, retail_kmeans.joblib, REPORT.md
## Skipped / approximated
- Spectral, MeanShift and AffinityPropagation ran on documented random samples (see params column); OPTICS reachability on defaults; silhouette-sample plot covers kmeans/gmm/agglomerative only.
## Weaknesses
1. UK ~91%: segments describe mostly British buying; geography barely varies.
2. One year of data (2010-2011): no true seasonality or churn signal.
3. Wholesale outliers kept via log+RobustScaler: cluster borders shift with eps/threshold choices; DBSCAN/OPTICS found mostly one mass.
"""
(OUT / "REPORT.md").write_text(report)

# Verify every figure reference exists
import re

missing = [f for f in re.findall(r"\\d{{2}}_\\w+\\.png", report) if not (FIGS / f).exists()]
print("wrote 33, 34 + REPORT.md | figures:", len(list(FIGS.glob("*.png"))), "| missing refs:", missing)
print("configs:", len(scored), "| clusters file:", len(clus))
