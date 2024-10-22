from openai import OpenAI

import pandas as pd
import numpy as np
import hdbscan
from umap import UMAP
import plotly.express as px

# rows_with_embeddings = client.query(
#     "SELECT request_body,embedding FROM request_response_rmt WHERE notEmpty(embedding)").result_rows


def generate_clusters(
    rows_with_embeddings: list[tuple[str, list[float]]]
):

    df = pd.DataFrame(rows_with_embeddings, columns=[
                      "request_body", "embedding"])
    embeddings = [np.array(x[1]) for x in rows_with_embeddings]

    hdb = hdbscan.HDBSCAN(min_samples=2, min_cluster_size=2).fit(embeddings)

    umap = UMAP(n_components=2, random_state=42, n_neighbors=80, min_dist=0.1)

    df_umap = (
        pd.DataFrame(umap.fit_transform(
            np.array(embeddings)), columns=['x', 'y'])
        .assign(cluster=lambda df: hdb.labels_.astype(str))
        # .query('cluster != "-1"')
        .sort_values(by='cluster')
    )

    df["cluster"] = hdb.labels_.astype(str)

    # Add the request_body to df_umap
    df_umap["request_body"] = df["request_body"]

    # Update the Plotly figure creation
    fig = px.scatter(
        df_umap,
        x='x',
        y='y',
        color='cluster',
        hover_data=['request_body']  # Add request_body to hover information
    )

    # Customize hover template to show only request_body
    fig.update_traces(
        hovertemplate="<br>".join([
            "Request Body: %{customdata[0]}",
        ])
    )

    fig.show()

    for c in df.cluster.unique():
        print(c)
        print(df[df.cluster == c]["request_body"].tolist())
    print(len(rows_with_embeddings))
