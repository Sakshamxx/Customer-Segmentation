import pandas as pd
from langchain_core.tools import tool
from ..rag.retriever import retrieve

@tool
def search_knowledge(query: str) -> str:
    """Search project docs about clusters, data cleaning, and model results."""
    return "\n\n".join(d["content"] for d in retrieve(query, k=3))

@tool
def get_cluster_profile(cluster_id: int) -> str:
    """Return the average feature values and size of one customer cluster."""
    df = pd.read_csv("outputs/cluster_profiles.csv", index_col="cluster")
    if cluster_id not in df.index:
        return f"No cluster {cluster_id}. Valid: {list(df.index)}"
    return df.loc[cluster_id].to_string()

TOOLS = [search_knowledge, get_cluster_profile]