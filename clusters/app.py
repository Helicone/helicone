from fastapi import FastAPI
from pydantic import BaseModel

import pandas as pd
import numpy as np
import hdbscan
from umap import UMAP

app = FastAPI()


class RequestWithEmbedding(BaseModel):
    request_id: str
    embedding: list[float]
    signed_body_url: str


@app.post("/clusters")
async def generate_clusters(requests: list[RequestWithEmbedding]):
    print(requests)
    df = pd.DataFrame(requests, columns=[
                      "request_id", "embedding", "signed_body_url"])
    embeddings = [np.array(x.embedding) for x in requests]

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
    df_umap["request_id"] = df["request_id"].apply(lambda x: x[1])
    df_umap["signed_body_url"] = df["signed_body_url"].apply(lambda x: x[1])
    return df_umap.to_dict(orient="records")
