"""All clustering runs. Failures are recorded, not hidden."""

import time
import warnings

import numpy as np
from sklearn.cluster import (
    AgglomerativeClustering,
    AffinityPropagation,
    Birch,
    DBSCAN,
    HDBSCAN,
    KMeans,
    MeanShift,
    MiniBatchKMeans,
    OPTICS,
    SpectralClustering,
    estimate_bandwidth,
)
from sklearn.mixture import GaussianMixture

warnings.filterwarnings("ignore")

SEED = 42


def _run(name, estimator, X, params, feature_set, store, rows, labels):
    t0 = time.perf_counter()
    try:
        lab = np.asarray(estimator.fit_predict(X))
    except Exception as exc:  # noqa: BLE001 - record and continue
        rows.append(
            {"model": name, "params": str(params), "feature_set": feature_set,
             "error": str(exc)[:200], "n_clusters": 0,
             "noise_frac": float("nan"), "runtime_s": time.perf_counter() - t0}
        )
        return
    runtime = time.perf_counter() - t0
    uniq = set(lab) - {-1}
    rows.append(
        {"model": name, "params": str(params), "feature_set": feature_set,
         "error": "", "n_clusters": len(uniq),
         "noise_frac": float((lab == -1).mean()),
         "runtime_s": round(runtime, 2)}
    )
    store[(name, str(params), feature_set)] = lab


def run_all(X, feature_set, seed=SEED, sample_cap=2000):
    """Fit every required family on one scaled matrix. Returns (meta, labels)."""
    rng = np.random.RandomState(seed)
    n = len(X)
    sample_idx = rng.choice(n, min(sample_cap, n), replace=False)
    aff_idx = rng.choice(n, min(1500, n), replace=False)
    rows, store = [], {}

    for k in range(2, 11):
        _run("kmeans", KMeans(n_clusters=k, n_init=10, random_state=seed),
             X, {"k": k}, feature_set, store, rows, None)
        _run("minibatch", MiniBatchKMeans(n_clusters=k, n_init=5, random_state=seed),
             X, {"k": k}, feature_set, store, rows, None)
    for link in ("ward", "complete", "average"):
        for k in range(2, 11):
            _run("agglomerative", AgglomerativeClustering(n_clusters=k, linkage=link),
                 X, {"linkage": link, "k": k}, feature_set, store, rows, None)
    for k in range(2, 11):
        _run("birch", Birch(n_clusters=k), X, {"k": k}, feature_set, store, rows, None)
    for k in range(2, 11):
        _run("spectral", SpectralClustering(n_clusters=k, affinity="nearest_neighbors",
                                            random_state=seed, assign_labels="kmeans"),
             np.asarray(X)[sample_idx], {"k": k, "sample": len(sample_idx)},
             feature_set, store, rows, None)

    # Density-based grids
    for eps in (0.5, 0.7, 0.9, 1.2):
        for ms in (10, 15, 25):
            _run("dbscan", DBSCAN(eps=eps, min_samples=ms), X,
                 {"eps": eps, "min_samples": ms}, feature_set, store, rows, None)
    for mcs in (15, 30, 50, 100):
        _run("hdbscan", HDBSCAN(min_cluster_size=mcs), X,
             {"min_cluster_size": mcs}, feature_set, store, rows, None)
    for ms in (15, 30):
        _run("optics", OPTICS(min_samples=ms), X,
             {"min_samples": ms}, feature_set, store, rows, None)

    # Bandwidth / affinity on documented samples
    try:
        bw = estimate_bandwidth(np.asarray(X)[sample_idx], quantile=0.2, random_state=seed)
        _run("meanshift", MeanShift(bandwidth=float(bw) if bw else None, bin_seeding=True),
             np.asarray(X)[sample_idx], {"sample": len(sample_idx)}, feature_set, store, rows, None)
    except Exception as exc:  # noqa: BLE001
        rows.append({"model": "meanshift", "params": "bandwidth-est",
                     "feature_set": feature_set, "error": str(exc)[:200],
                     "n_clusters": 0, "noise_frac": float("nan"), "runtime_s": 0.0})
    _run("affinity", AffinityPropagation(damping=0.9, random_state=seed),
         np.asarray(X)[aff_idx], {"sample": len(aff_idx)}, feature_set, store, rows, None)

    import pandas as pd

    return pd.DataFrame(rows), store


def run_gmm(X, feature_set):
    """Full GMM grid with BIC/AIC for model choice."""
    import pandas as pd

    rows, store, curves = [], {}, []
    for cov in ("full", "tied", "diag", "spherical"):
        for k in range(2, 11):
            t0 = time.perf_counter()
            try:
                gm = GaussianMixture(n_components=k, covariance_type=cov, random_state=SEED)
                lab = gm.fit_predict(X)
                rows.append({"model": "gmm", "params": str({"k": k, "cov": cov}),
                             "feature_set": feature_set, "error": "",
                             "n_clusters": k, "noise_frac": 0.0,
                             "runtime_s": round(time.perf_counter() - t0, 2),
                             "bic": float(gm.bic(X)), "aic": float(gm.aic(X))})
                store[("gmm", str({"k": k, "cov": cov}), feature_set)] = lab
                curves.append((cov, k, float(gm.bic(X)), float(gm.aic(X))))
            except Exception as exc:  # noqa: BLE001
                rows.append({"model": "gmm", "params": str({"k": k, "cov": cov}),
                             "feature_set": feature_set, "error": str(exc)[:200],
                             "n_clusters": 0, "noise_frac": float("nan"),
                             "runtime_s": 0.0, "bic": float("nan"), "aic": float("nan")})
    return pd.DataFrame(rows), store, pd.DataFrame(curves, columns=["cov", "k", "bic", "aic"])
