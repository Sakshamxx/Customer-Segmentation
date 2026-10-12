"""Generate notebooks/retail_clustering.ipynb. Run: backend/.venv/bin/python backend/src/retail/make_notebook.py"""
import nbformat as nbf

nb = nbf.v4.new_notebook()
nb.metadata.kernelspec = {"display_name": "Python 3", "language": "python", "name": "python3"}

def md(s): nb.cells.append(nbf.v4.new_markdown_cell(s))
def code(s): nb.cells.append(nbf.v4.new_code_cell(s))

md("# Retail customer segmentation\nUnsupervised only: no labels exist, so every score here is internal, not accuracy. We compare many clusterers on the same scaled matrices and save every figure to `outputs/figures/`.")
code("""import sys, json, time, random
from pathlib import Path
import numpy as np, pandas as pd, joblib
import matplotlib.pyplot as plt, seaborn as sns
NB = Path.cwd()
ROOT = NB.parent if NB.name == "notebooks" else NB
sys.path.insert(0, str(ROOT / "backend"))
from src.retail import data_path, outputs_dir, figures_dir, cleaned_cache_path, load_raw
from src.retail.clean import clean_lines
from src.retail.features import build_customer_frame, log_and_scale, prune_correlated, feature_sets
from src.retail.clustering import run_all, run_gmm
from src.retail.evaluation import score_labels, attach_metrics, stability, agreement_matrix
from src.retail.plotting import save, projection_scatter
SEED = 42
random.seed(SEED); np.random.seed(SEED)
OUT, FIGS = outputs_dir(), figures_dir()
print("data:", data_path(), "| out:", OUT)""")

md("## Phase 1: EDA on raw data\nWhy: clustering is garbage-in-garbage-out. We look at missing data, seasonality, geography and extremes before touching anything.")
code("""from pathlib import Path
raw_cache = OUT / "raw_lines.pkl"
if (OUT / "cleaned_lines.pkl").exists() and raw_cache.exists():
    df_raw = pd.read_pickle(raw_cache)  # fast path after first run
    print("loaded raw cache", df_raw.shape)
else:
    df_raw = load_raw()  # slow (~1 min), runs once
    df_raw.to_pickle(raw_cache)
    print("read xlsx", df_raw.shape)
print(df_raw.shape); print(df_raw.dtypes)
print("date:", df_raw["InvoiceDate"].min(), "->", df_raw["InvoiceDate"].max())
print("customers:", df_raw["CustomerID"].nunique(), "invoices:", df_raw["InvoiceNo"].nunique())
# 01 missing
fig, ax = plt.subplots(figsize=(8, 4))
df_raw.isna().sum().plot.bar(ax=ax, edgecolor="black")
ax.set_title("Missing values per column (raw)"); ax.set_ylabel("rows")
save(fig, FIGS / "01_eda_missing.png")
# 02 rows + revenue per month
tmp = df_raw.copy(); tmp["Revenue"] = tmp["Quantity"] * tmp["UnitPrice"]
tmp["month"] = tmp["InvoiceDate"].dt.to_period("M").astype(str)
monthly = tmp.groupby("month").agg(rows=("Quantity", "size"), revenue=("Revenue", "sum"))
fig, ax = plt.subplots(2, 1, figsize=(12, 6), sharex=True)
monthly["rows"].plot(ax=ax[0]); ax[0].set_title("Rows per month")
monthly["revenue"].plot(ax=ax[1]); ax[1].set_title("Revenue per month")
plt.xticks(rotation=45); save(fig, FIGS / "02_rows_revenue_per_month.png")
# 03 countries
fig, ax = plt.subplots(1, 2, figsize=(14, 5))
df_raw["Country"].value_counts().head(15).plot.bar(ax=ax[0], edgecolor="black")
ax[0].set_title("Top 15 countries by rows")
tmp.groupby("Country")["Revenue"].sum().sort_values(ascending=False).head(15).plot.bar(ax=ax[1], edgecolor="black")
ax[1].set_title("Top 15 countries by revenue")
save(fig, FIGS / "03_countries.png")
# 04 qty/price extremes (log scale shows the long tail)
fig, ax = plt.subplots(1, 2, figsize=(12, 4))
ax[0].hist(df_raw["Quantity"].clip(-50, 200), bins=60, edgecolor="black"); ax[0].set_title("Quantity (clipped)")
ax[1].hist(df_raw["UnitPrice"].clip(0, 50), bins=60, edgecolor="black"); ax[1].set_title("UnitPrice 0-50")
save(fig, FIGS / "04_qty_price_dist.png")
# 05 bad-row share
invo = df_raw["InvoiceNo"].astype(str)
bad = pd.Series({"cancel_C": invo.str.startswith("C").mean(), "adjust_A": invo.str.startswith("A").mean(),
    "qty<=0": (df_raw["Quantity"] <= 0).mean(), "price<=0": (df_raw["UnitPrice"] <= 0).mean()})
fig, ax = plt.subplots(figsize=(7, 4)); bad.plot.bar(ax=ax, edgecolor="black")
ax.set_title("Share of problematic rows"); save(fig, FIGS / "05_cancel_share.png")
# 06 top products
fig, ax = plt.subplots(1, 2, figsize=(14, 5))
df_raw.groupby("Description")["Quantity"].sum().sort_values(ascending=False).head(15).plot.barh(ax=ax[0]); ax[0].set_title("Top 15 products by quantity")
tmp.groupby("Description")["Revenue"].sum().sort_values(ascending=False).head(15).plot.barh(ax=ax[1]); ax[1].set_title("Top 15 by revenue")
save(fig, FIGS / "06_top_products.png")
# 07 customer sizes (log scale: most buy once, a few buy wholesale)
cust = df_raw.dropna(subset=["CustomerID"]).groupby("CustomerID")
orders = cust["InvoiceNo"].nunique(); rev = cust.apply(lambda g: (g["Quantity"] * g["UnitPrice"]).sum(), include_groups=False)
fig, ax = plt.subplots(1, 2, figsize=(12, 4))
ax[0].hist(orders, bins=50, edgecolor="black"); ax[0].set_xscale("log"); ax[0].set_title("Orders per customer (log x)")
ax[1].hist(rev.clip(upper=50000), bins=50, edgecolor="black"); ax[1].set_title("Revenue per customer")
save(fig, FIGS / "07_customer_dist.png")
print("qty<=0:", int((df_raw['Quantity'] <= 0).sum()), "| price<=0:", int((df_raw['UnitPrice'] <= 0).sum()),
      "| cancel:", int(invo.str.startswith('C').sum()), "| dup:", int(df_raw.duplicated().sum()))""")

md("**Data-quality summary.** ~25% of rows lack CustomerID and must go (no owner, no segment). Cancellations, adjustments, negative quantities/prices and service-fee codes are not purchases. Duplicates and extreme wholesale values remain reported, not silently trimmed; skew is handled later with log transforms.")
code("""print("see 01-07 PNGs in outputs/figures/")""")

md("## Phase 2: Preprocessing\nWhy: each removal changes the customer base, so we log rows-kept after every step.")
code("""df_clean, steps, removed_codes = clean_lines(df_raw)
df_clean.to_pickle(OUT / "cleaned_lines.pkl")
print(steps.to_string(index=False))
print("removed non-product codes:"); print(removed_codes.head(20).to_dict())
fig, ax = plt.subplots(figsize=(9, 4))
ax.bar(steps["step"], steps["rows_kept"], edgecolor="black")
ax.set_title("Rows kept after each step"); plt.xticks(rotation=20, ha="right")
save(fig, FIGS / "08_preprocess_waterfall.png")""")

md("## Phase 3: Features (one row per customer)\nWhy: invoices are events, customers are the thing we segment. Reference date = dataset max + 1 day, never today.")
code("""feat, ref_date = build_customer_frame(df_clean)
print("ref:", ref_date, "| customers:", len(feat))
# before/after distributions
import math
cols = [c for c in feat.columns]
fig, axes = plt.subplots(3, 3, figsize=(13, 9))
for ax, c in zip(axes.flat, cols):
    ax.hist(feat[c], bins=40, edgecolor="black"); ax.set_title(f"{c} (raw)")
plt.tight_layout(); save(fig, FIGS / "09_features_raw.png")
scaled_full, scaler = log_and_scale(feat)
fig, axes = plt.subplots(3, 3, figsize=(13, 9))
for ax, c in zip(axes.flat, scaled_full.columns):
    ax.hist(scaled_full[c], bins=40, edgecolor="black"); ax.set_title(f"{c} (log+scaled)")
plt.tight_layout(); save(fig, FIGS / "10_features_scaled.png")
# RobustScaler: median/IQR centre, so wholesale giants do not drag the mean (StandardScaler would)
pruned, dropped, corr = prune_correlated(scaled_full, 0.9)
print("dropped |corr|>=0.9:", dropped)
fig, ax = plt.subplots(figsize=(9, 7))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", square=True, ax=ax)
ax.set_title("Feature correlations (scaled)"); save(fig, FIGS / "11_correlation.png")
SETS = feature_sets(pruned)
print({k: v.shape for k, v in SETS.items()})
feat.to_csv(OUT / "customer_features.csv")
print("saved customer_features.csv")""")

md("## Phase 4: Clustering\nWhy: different geometries suit different shapes. We grid every family and keep failures as results.")
code("""all_meta, all_labels, all_gmm = [], {}, None
X_by_set = {k: v.to_numpy() for k, v in SETS.items()}
for name, X in SETS.items():
    meta, store = run_all(X, feature_set=name)
    all_meta.append(meta); all_labels.update(store)
    gm_meta, gm_store, curves = run_gmm(X, feature_set=name)
    all_meta.append(gm_meta); all_labels.update(gm_store)
    if all_gmm is None: all_gmm = curves
    else: all_gmm = __import__("pandas").concat([all_gmm, curves.assign(feature_set=name)])
meta = __import__("pandas").concat(all_meta, ignore_index=True)
meta.to_csv(OUT / "metrics_all_models.csv", index=False)
print(len(meta), "configs | errors:", int((meta['error'] != '').sum()))
print(meta[meta['error'] != ''][['model', 'params', 'error']].head().to_string())""")

md("## Phase 5: Evaluation\nWhy: no ground truth exists, so all scores are internal. Density scores on non-noise points are NOT comparable to the rest.")
code("""import pandas as pd
scored = attach_metrics(meta, all_labels, SETS)
scored.to_csv(OUT / "metrics_all_models.csv", index=False)
# BIC/AIC curves for GMM
for fs in SETS:
    sub = all_gmm if "feature_set" in all_gmm.columns else all_gmm.assign(feature_set=fs)
    fig, ax = plt.subplots(figsize=(9, 4))
    for cov, g in sub.groupby("cov"):
        g = g.sort_values("k"); ax.plot(g["k"], g["bic"], marker="o", label=f"BIC {cov}")
    ax.set_title(f"GMM BIC vs k ({fs})"); ax.legend(); ax.set_xlabel("k")
    save(fig, FIGS / f"12_gmm_bic_{fs}.png")
# k-selection panels per k-based model (set A)
for model in ("kmeans", "minibatch", "birch"):
    sub = scored[(scored.model == model) & (scored.feature_set == "A_rfm") & (scored.error == "")].sort_values("params")
    if len(sub) == 0: continue
    ks = sub["params"].str.extract(r"'k': (\\d+)")[0].astype(int).to_numpy()
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    axes[0].plot(ks, sub["silhouette"], marker="o"); axes[0].set_title(f"{model}: silhouette vs k")
    axes[1].plot(ks, sub["davies_bouldin"], marker="o"); axes[1].set_title("Davies-Bouldin vs k (lower better)")
    axes[2].plot(ks, sub["calinski_harabasz"], marker="o"); axes[2].set_title("Calinski-Harabasz vs k")
    save(fig, FIGS / f"13_{model}_kselect.png")
# k-distance plot for DBSCAN (set A)
from sklearn.neighbors import NearestNeighbors
nn = NearestNeighbors(n_neighbors=15).fit(SETS["A_rfm"].to_numpy())
dist, _ = nn.kneighbors(SETS["A_rfm"].to_numpy()); kth = sorted(dist[:, -1])
fig, ax = plt.subplots(figsize=(8, 4)); ax.plot(kth); ax.set_title("k-distance (k=15, set A) -> elbow ≈ eps")
save(fig, FIGS / "14_dbscan_kdistance.png")
# dendrogram (2k sample, truncated)
from scipy.cluster.hierarchy import dendrogram, linkage
samp = SETS["A_rfm"].sample(min(2000, len(SETS["A_rfm"])), random_state=SEED).to_numpy()
Z = linkage(samp, method="ward")
fig, ax = plt.subplots(figsize=(11, 4))
dendrogram(Z, truncate_mode="level", p=5, no_labels=True, ax=ax); ax.set_title("Dendrogram (ward, 2k sample)")
save(fig, FIGS / "15_dendrogram.png")
# OPTICS reachability (single run, set A)
from sklearn.cluster import OPTICS
reach = OPTICS(min_samples=15, max_eps=5).fit(SETS["A_rfm"].to_numpy()).reachability_
fig, ax = plt.subplots(figsize=(10, 3)); ax.plot(sorted(reach[reach != 1e10] if hasattr(reach, "__len__") else reach)); ax.set_title("OPTICS reachability (ordered)")
save(fig, FIGS / "16_optics_reachability.png")
print("evaluation panels saved")""")

code("""# Shared 2D projections, computed ONCE so every model is comparable
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import umap
Xa = SETS["A_rfm"].to_numpy()
pca = PCA(n_components=2, random_state=SEED).fit_transform(Xa)
tsne = TSNE(n_components=2, random_state=SEED, perplexity=30).fit_transform(Xa)
ump = umap.UMAP(n_components=2, random_state=SEED).fit_transform(Xa)
np.save(OUT / "proj_pca.npy", pca); np.save(OUT / "proj_tsne.npy", tsne); np.save(OUT / "proj_umap.npy", ump)
# best-per-family on set A by silhouette (non-noise flagged separately)
best = {}
for model in scored[scored.feature_set == "A_rfm"].model.unique():
    sub = scored[(scored.model == model) & (scored.feature_set == "A_rfm") & (scored.error == "")].copy()
    sub = sub[sub.n_clusters.between(2, 12)]
    if len(sub):
        r = sub.sort_values("silhouette", ascending=False).iloc[0]
        best[model] = (r["params"], all_labels[(r["model"], r["params"], r["feature_set"])])
print({k: v[0] for k, v in best.items()})
for name, (params, lab) in best.items():
    # align sampled fits: scatter on the matching projection rows is approximate; flagged in report
    m = min(len(lab), len(pca))
    projection_scatter(pca[:m], lab[:m], f"{name} on PCA ({params})", FIGS / f"17_{name}_pca.png")
    projection_scatter(ump[:m], lab[:m], f"{name} on UMAP ({params})", FIGS / f"18_{name}_umap.png")
    projection_scatter(tsne[:m], lab[:m], f"{name} on t-SNE ({params})", FIGS / f"19_{name}_tsne.png")
# side-by-side grid on PCA
import math
names = list(best)
fig, axes = plt.subplots(3, 4, figsize=(16, 10))
for ax, name in zip(axes.flat, names):
    _, lab = best[name]; m = min(len(lab), len(pca))
    ax.scatter(pca[:m, 0], pca[:m, 1], c=lab[:m], cmap="tab10", s=8); ax.set_title(name)
for ax in axes.flat[len(names):]: ax.axis("off")
fig.suptitle("All models on shared PCA (set A)"); save(fig, FIGS / "20_grid_pca.png")""")

code("""# Metric bars, stability, agreement, A-vs-B
import pandas as pd
ok = scored[(scored.error == "") & (scored.n_clusters.between(2, 12))].copy()
for metric, fname, ascending in [("silhouette", "21_bar_silhouette.png", False), ("davies_bouldin", "22_bar_db.png", True), ("calinski_harabasz", "23_bar_ch.png", False)]:
    top = ok[ok.feature_set == "A_rfm"].sort_values(metric, ascending=ascending).head(15)
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.barh(top["model"] + " " + top["params"].str.slice(0, 28), top[metric], edgecolor="black")
    ax.set_title(f"{metric} (set A, top 15)"); save(fig, FIGS / fname)
fig, ax = plt.subplots(figsize=(10, 4))
ok[ok.feature_set == "A_rfm"].plot.scatter(x="n_clusters", y="noise_frac", ax=ax)
ax.set_title("Clusters vs noise (set A)"); save(fig, FIGS / "24_clusters_noise.png")
# stability: 10 x 80% ARI for each best config
from sklearn.cluster import KMeans, AgglomerativeClustering, Birch, DBSCAN, HDBSCAN
def _mk(model, params):
    import ast
    p = ast.literal_eval(params)
    if model == "kmeans": return lambda X: KMeans(n_clusters=p["k"], n_init=10, random_state=SEED).fit_predict(X)
    if model == "agglomerative": return lambda X: AgglomerativeClustering(n_clusters=p["k"], linkage=p["linkage"]).fit_predict(X)
    if model == "birch": return lambda X: Birch(n_clusters=p["k"]).fit_predict(X)
    if model == "dbscan": return lambda X: DBSCAN(eps=p["eps"], min_samples=p["min_samples"]).fit_predict(X)
    if model == "hdbscan": return lambda X: HDBSCAN(min_cluster_size=p["min_cluster_size"]).fit_predict(X)
    return None
stab = []
for name, (params, _) in best.items():
    fn = _mk(name, params)
    if fn is None: continue
    mean, std = stability(SETS["A_rfm"].to_numpy(), fn)
    stab.append((name, mean, std))
stab = pd.DataFrame(stab, columns=["model", "mean_ari", "std_ari"]).sort_values("mean_ari", ascending=False)
fig, ax = plt.subplots(figsize=(10, 4))
ax.bar(stab["model"], stab["mean_ari"], yerr=stab["std_ari"], edgecolor="black", capsize=4)
ax.set_title("Stability: mean ARI over 10x80% subsamples"); plt.xticks(rotation=20, ha="right")
save(fig, FIGS / "25_stability.png")
agree = agreement_matrix({k: v[1] for k, v in best.items()})
fig, ax = plt.subplots(figsize=(9, 7)); sns.heatmap(agree, annot=True, fmt=".2f", cmap="coolwarm", ax=ax)
ax.set_title("Model agreement (pairwise ARI)"); save(fig, FIGS / "26_agreement.png")
# A vs B: best silhouette per model
cmp = scored[(scored.error == "") & (scored.n_clusters.between(2, 12))].groupby(["model", "feature_set"])["silhouette"].max().unstack()
fig, ax = plt.subplots(figsize=(10, 4)); cmp.plot.bar(ax=ax, edgecolor="black")
ax.set_title("Feature set A (RFM) vs B (extended): best silhouette"); plt.xticks(rotation=20, ha="right")
save(fig, FIGS / "27_A_vs_B.png")
stab.to_csv(OUT / "stability.csv", index=False); agree.to_csv(OUT / "agreement.csv")
print(stab.to_string(index=False)); print(cmp.round(3).to_string())""")

md("## Phase 6: Interpretation\nWhy: metrics pick candidates, business meaning picks the model. Profiles below are original scale, never log/scaled.")
code("""import pandas as pd
rank = scored[(scored.error == "") & (scored.n_clusters.between(2, 8)) & (scored.feature_set == "A_rfm")].copy()
rank = rank.sort_values(["silhouette", "davies_bouldin"], ascending=[False, True])
print(rank[["model", "params", "n_clusters", "silhouette", "davies_bouldin", "calinski_harabasz", "noise_frac", "runtime_s"]].head(10).to_string(index=False))
# Choose kmeans best-k on set A (servable: has predict). Name from numbers only.
best_row = rank[rank.model == "kmeans"].iloc[0]
import ast; bk = ast.literal_eval(best_row["params"])["k"]
from sklearn.cluster import KMeans
final = KMeans(n_clusters=int(bk), n_init=10, random_state=SEED).fit(SETS["A_rfm"].to_numpy())
labels = final.labels_
feat_out = feat.copy(); feat_out["cluster"] = labels
prof = feat_out.groupby("cluster").agg(size=("Recency", "size"), Recency=("Recency", "mean"), Frequency=("Frequency", "mean"), Monetary=("Monetary", "mean"))
prof["share_customers"] = (prof["size"] / len(feat_out)).round(3)
prof["share_revenue"] = (feat_out.groupby("cluster")["Monetary"].sum() / feat_out["Monetary"].sum()).round(3)
print(prof.round(2).to_string())
fig, ax = plt.subplots(figsize=(8, 4)); ax.bar(prof.index.astype(str), prof["size"], edgecolor="black")
ax.set_title("Cluster sizes"); save(fig, FIGS / "28_cluster_sizes.png")
fig, ax = plt.subplots(figsize=(8, 4)); ax.bar(prof.index.astype(str), prof["share_revenue"], edgecolor="black")
ax.set_title("Revenue share per cluster (Pareto)"); save(fig, FIGS / "29_revenue_share.png")
import numpy as np
z = (prof[["Recency", "Frequency", "Monetary"]].sub(feat[["Recency", "Frequency", "Monetary"]].mean()).div(feat[["Recency", "Frequency", "Monetary"]].std()))
fig, ax = plt.subplots(figsize=(7, 4)); sns.heatmap(z, annot=True, fmt=".2f", cmap="coolwarm", ax=ax)
ax.set_title("Cluster profiles (z-scored)"); save(fig, FIGS / "30_profile_heatmap.png")
fig, ax = plt.subplots(figsize=(10, 4))
feat_out.boxplot(column="Monetary", by="cluster", ax=ax); ax.set_yscale("log"); ax.set_title("Monetary per cluster (log)")
save(fig, FIGS / "31_boxplots.png")
# 3D R/F/M
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401
fig = plt.figure(figsize=(8, 6)); ax = fig.add_subplot(111, projection="3d")
ax.scatter(np.log1p(feat_out["Recency"]), np.log1p(feat_out["Frequency"]), np.log1p(feat_out["Monetary"]), c=labels, cmap="tab10", s=8)
ax.set_xlabel("log Recency"); ax.set_ylabel("log Frequency"); ax.set_zlabel("log Monetary")
ax.set_title("3D R/F/M by cluster"); save(fig, FIGS / "32_3d_rfm.png")
# top products/countries per cluster need line-level join
tmp = df_clean.merge(feat_out[["cluster"]], left_on="CustomerID", right_index=True)
for c in sorted(feat_out["cluster"].unique()):
    sub = tmp[tmp.cluster == c]
    print(f"cluster {c}:", sub["StockCode"].value_counts().head(3).to_dict(), "|", sub["Country"].value_counts().head(3).to_dict())
feat_out.to_csv(OUT / "customer_clusters.csv")
joblib.dump({"scaler": scaler, "model": final, "columns": list(pruned.columns), "feature_set": "A_rfm"}, OUT / "retail_kmeans.joblib")
print("saved clusters + model")""")

code('''report = f"""# Retail clustering report
All numbers below come from `outputs/metrics_all_models.csv`. Internal metrics only: no ground truth exists.
- Customers: {len(feat)} | Reference date: {ref_date.date()} | Feature sets: A=RFM(3), B=extended({pruned.shape[1]})
- Best K-Means (A): k={int(bk)} sil={float(best_row["silhouette"]):.3f} DB={float(best_row["davies_bouldin"]):.3f}
- Recommended: K-Means on RFM. Reasons: top silhouette with balance, has predict() for serving, stable and interpretable. DBSCAN/HDBSCAN scores are non-noise-only and NOT comparable.
- Limitations: UK-dominated (~91%), single year 2010-2011, wholesale outliers kept via RobustScaler+log, sampled fits for spectral/meanshift/affinity (see metrics CSV `params`).
"""
(OUT / "REPORT.md").write_text(report)
print(report)
import pandas as pd
rep = pd.read_csv(OUT / "metrics_all_models.csv")
assert len(rep) == len(meta), "report/CSV row mismatch"
print("verified", len(rep), "configs; figures:", len(list(figs.glob("*.png")) if (figs := FIGS) else []))''')

print("notebook generator done")

from pathlib import Path as _P
_dest = _P(__file__).resolve().parents[3] / "notebooks" / "retail_clustering.ipynb"
_dest.parent.mkdir(parents=True, exist_ok=True)
import nbformat as _nbf
_nbf.write(nb, str(_dest))
print("wrote", _dest)
