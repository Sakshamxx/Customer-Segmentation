"""One style for every figure. All plots saved as PNG at 150+ dpi."""

import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

matplotlib.rcParams.update({
    "figure.dpi": 150, "savefig.dpi": 150,
    "axes.titlesize": 11, "axes.labelsize": 10,
    "xtick.labelsize": 9, "ytick.labelsize": 9,
})
PALETTE = "tab10"
sns.set_theme(style="whitegrid", palette=PALETTE)


def save(fig, path):
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def projection_scatter(coords, labels, title, path, noise_grey=True):
    import numpy as np

    fig, ax = plt.subplots(figsize=(7, 5))
    labels = np.asarray(labels)
    if noise_grey and (labels == -1).any():
        m = labels == -1
        ax.scatter(coords[m, 0], coords[m, 1], c="grey", s=10, alpha=0.5, label="noise")
        coords, labels = coords[~m], labels[~m]
    sc = ax.scatter(coords[:, 0], coords[:, 1], c=labels, cmap="tab10", s=12, alpha=0.8)
    ax.set_title(title)
    ax.set_xlabel("dim 1")
    ax.set_ylabel("dim 2")
    fig.colorbar(sc, ax=ax, label="cluster")
    save(fig, path)
