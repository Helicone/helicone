from abc import ABC, abstractmethod
from typing import Dict
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from torch.nn.functional import softmax
from tqdm import tqdm
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import os

MAX_TOKENS_PER_CHUNK = 512

MAX_CHUNKS = 8

# MAX_TOKEN_WINDOW = MAX_TOKENS_PER_CHUNK * MAX_CHUNKS
AVERAGE_TOKEN_LENGTH = 4
MARGIN_OF_ERROR = 0.20
MAX_TEXT_LENGTH = int(MAX_TOKENS_PER_CHUNK *
                      AVERAGE_TOKEN_LENGTH * MAX_CHUNKS * (1 + MARGIN_OF_ERROR))

prompt_guard_model_path = os.path.join(
    os.path.dirname(__file__), "./prompt-guard-86m")


def download_prompt_guard_model():
    import os
    import boto3

    # Skip if file already exists
    if os.path.exists(prompt_guard_model_path):
        print("Prompt-guard model already exists")
        return

    try:
        print("Downloading prompt-guard model")
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
            region_name=os.getenv('S3_REGION'),
        )

        # Get file size
        response = s3.head_object(
            Bucket="helicone-llm-models",
            Key='prompt-guard-86m.tar.gz'
        )
        total_length = response['ContentLength']

        # Download with progress bar
        with tqdm(total=total_length, unit='B', unit_scale=True, desc="Downloading prompt-guard model") as pbar:
            s3.download_file(
                Bucket="helicone-llm-models",
                Key='prompt-guard-86m.tar.gz',
                Filename='prompt-guard-86m.tar.gz',
                Callback=lambda bytes_transferred: pbar.update(
                    bytes_transferred)
            )

        print("Downloaded prompt-guard-86m.tar.gz")
        # Extract the model file
        print("Extracting prompt-guard-86m.tar.gz")
        os.system('tar -xzf prompt-guard-86m.tar.gz')
        print("Extracted prompt-guard-86m.tar.gz")
        # Remove the tar.gz file
        print("Removing prompt-guard-86m.tar.gz")
        os.remove('prompt-guard-86m.tar.gz')
        print("Removed prompt-guard-86m.tar.gz")
    except Exception as e:
        print(f"Error downloading model: {str(e)}")
        raise


# Initialize FastAPI app
app = FastAPI(
    title="Prompt Security API",
    description="API for detecting prompt injection and jailbreak attempts"
)


class TextRequest(BaseModel):
    text: str
    temperature: float = 1.0


class BaseSecurityModel(ABC):
    def __init__(self, device: str = 'cpu'):
        self.device = device
        self.model = None
        self.tokenizer = None

    @abstractmethod
    def load_model(self):
        pass

    @abstractmethod
    def get_scores(self, text: str, temperature: float = 1.0) -> Dict[str, float]:
        pass


class PromptGuardModel(BaseSecurityModel):
    def __init__(self, device: str = 'cpu', num_workers: int = 6):
        super().__init__(device)
        self.num_workers = num_workers

    def load_model(self):
        model_path = prompt_guard_model_path
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_path, local_files_only=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_path, local_files_only=True)
        self.model.to(self.device)
        self.model.eval()
        return self

    def _tokenize_chunk(self, chunk: str):
        # Ensure we get a dictionary with the correct structure and proper padding
        return self.tokenizer(chunk,
                              padding='max_length',  # Changed from True to 'max_length'
                              truncation=True,
                              max_length=MAX_TOKENS_PER_CHUNK,
                              return_tensors=None)

    def get_class_probabilities(self, text: str, temperature: float = 1.0) -> torch.Tensor:
        # More efficient text splitting using character count instead of words
        max_length = MAX_TOKENS_PER_CHUNK
        text_length = len(text)
        n_chunks = min(MAX_CHUNKS, (text_length +
                       max_length - 1) // max_length)
        chunk_size = (text_length + n_chunks - 1) // n_chunks

        # Create chunks based on character count
        chunks = [text[i:i + chunk_size]
                  for i in range(0, text_length, chunk_size)]

        # Parallel tokenization of chunks
        tokenized_chunks = [self._tokenize_chunk(chunk) for chunk in chunks]

        # Convert tokenized chunks to tensors and move to device
        all_input_ids = torch.tensor(
            [tc['input_ids'] for tc in tokenized_chunks]).to(self.device)
        all_attention_mask = torch.tensor(
            [tc['attention_mask'] for tc in tokenized_chunks]).to(self.device)

        # Process all chunks at once
        with torch.no_grad():
            logits = self.model(input_ids=all_input_ids,
                                attention_mask=all_attention_mask).logits

        scaled_logits = logits / temperature
        probabilities = softmax(scaled_logits, dim=-1)

        # Take maximum across all chunks
        return torch.max(probabilities, dim=0)[0].unsqueeze(0)

    def get_scores(self, text: str, temperature: float = 1.0) -> Dict[str, float]:
        probabilities = self.get_class_probabilities(text, temperature)
        return {
            "jailbreak_score": probabilities[0, 2].item(),
            "indirect_injection_score": (probabilities[0, 1] + probabilities[0, 2]).item(),
        }


# Initialize model globally with 6 workers (half of available cores)
cpu_count = os.cpu_count() or 8
global_model = PromptGuardModel(num_workers=cpu_count // 2).load_model()


@app.post("/check_security")
async def check_security(request: TextRequest):
    """
    Check text for both jailbreak and indirect injection attempts using the specified model
    """
    try:
        if len(request.text) > MAX_TEXT_LENGTH:
            request.text = request.text[:MAX_TEXT_LENGTH]

        scores = global_model.get_scores(request.text, request.temperature)
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    try:
        download_prompt_guard_model()
    except Exception as e:
        print(f"Error downloading model: {str(e)}")

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001)
