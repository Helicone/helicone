from fastapi import FastAPI
from pydantic import BaseModel
import anthropic


class Item(BaseModel):
    sample_str: str


app = FastAPI()


@app.post("/anthropic/count_tokens")
async def count_tokens_endpoint(item: Item):
    num_tokens = anthropic.count_tokens(item.sample_str)
    return {"Number of tokens": num_tokens}


@app.get("/healthcheck")
def healthcheck():
    return {"status": "healthy"}
