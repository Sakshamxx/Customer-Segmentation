"""Internal clustering metrics, stability and agreement. No ground truth exists."""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    adjusted_rand_score,
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)


def score_labels(X, labels):
    """Metrics on the same scaled matrix. Density scores use non-noise only."""
    labels = np.asarray(labels)
    uniq = set(labels) - {-1}
    noise_frac = float((labels == -1).mean())
    out = {"n_clusters": len(uniq), "noise_frac": round(noise_frac, 4)}
    if len(uniq) < 2:
        out.update({"silhouette": float("nan"), "davies_bouldin": float("nan"),
                    "calinski_harabasz": float("nan"), "on_subset": False,
                    "note": "single cluster"})
        return out
    mask = labels != -1
    subset = bool(noise_frac > 0)
    Xm, lm = (X[mask], labels[mask]) if subset else (X, labels)
    out.update({
        "silhouette": round(float(silhouette_score(Xm, lm)), 3),
        "davies_bouldin": round(float(davies_bouldin_score(Xm, lm)), 3),
        "calinski_harabasz": round(float(calinski_harabasz_score(Xm, lm)), 1),
        "on_subset": subset,
        "note": "non-noise only; NOT comparable" if subset else "",
    })
    return out


def attach_metrics(meta: pd.DataFrame, labels_by_key, X_by_set):
    rows = []
    for _, r in meta.iterrows():
        if r.get("error"):
            rows.append({**r.to_dict(), "silhouette": float("nan"),
                         "davies_bouldin": float("nan"), "calinski_harabasz": float("nan")})
            continue
        key = (r["model"], r["params"], r["feature_set"])
        lab = labels_by_key.get(key)
        X = np.asarray(X_by_set[r["feature_set"]])
        # Sampled fits (spectral/meanshift/affinity) cover a subset; score on that subset
        if lab is not None and len(lab) != len(X):
            n = len(lab)
            X = X[np.random.RandomState(42).choice(len(X), n, replace=False)]
        rows.append({**r.to_dict(), **score_labels(X, lab)})
    return pd.DataFrame(rows)


def stability(X, make_labels, seed=42, trials=10, frac=0.8):
    """ARI of 80% subsamples vs full-data labels. Higher = more stable."""
    rng = np.random.RandomState(seed)
    full = np.asarray(make_labels(np.asarray(X)))
    scores = []
    for _ in range(trials):
        idx = rng.choice(len(X), int(len(X) * frac), replace=False)
        try:
            sub = np.asarray(make_labels(np.asarray(X)[idx]))
            # Compare on the subsample: map full labels to same rows
            scores.append(adjusted_rand_score(full[idx], sub))
        except Exception:  # noqa: BLE001 - unstable config scores 0
            scores.append(0.0)
    return round(float(np.mean(scores)), 3), round(float(np.std(scores)), 3)


def agreement_matrix(label_dict):
    """Pairwise ARI between best-per-model labelings."""
    names = list(label_dict)
    mat = pd.DataFrame(np.eye(len(names)), index=names, columns=names).round(3)
    for i, a in enumerate(names):
        for j, b in enumerate(names):
            if j > i:
                # Align lengths for sampled models by truncating to the shorter
                la, lb = np.asarray(label_dict[a]), np.asarray(label_dict[b])
                m = min(len(la), len(lb))
                v = round(float(adjusted_rand_score(la[:m], lb[:m])), 3)
                mat.loc[a, b] = mat.loc[b, a] = v
    return mat
