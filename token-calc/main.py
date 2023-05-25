from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import anthropic


class Item(BaseModel):
    text: str


app = FastAPI()


@app.post("/anthropic/count_tokens")
async def count_tokens_endpoint(item: Item):
    num_tokens = anthropic.count_tokens(item.text)
    return {"count": num_tokens}


@app.get("/healthcheck")
def healthcheck():
    return {"status": "healthy"}


# Redirect to docs if no path is specified
@app.get("/")
def redirect_to_docs():
    return RedirectResponse(url="https://helicone.ai/token_count")
