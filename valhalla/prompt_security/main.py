import torch
from torch.nn.functional import softmax
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from abc import ABC, abstractmethod
import os
from enum import Enum
from typing import Dict, Any, Tuple
import requests
from tqdm import tqdm


S3_LINK_FOR_PROMPT_GUARD = os.getenv("S3_LINK_FOR_PROMPT_GUARD")


def download_prompt_guard_model():
    import boto3
    import os
    # Skip if file already exists
    if os.path.exists('prompt-guard-86m'):
        return

    try:
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


download_prompt_guard_model()

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
    def load_model(self):
        model_path = "./prompt-guard-86m"  # or use absolute path
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_path, local_files_only=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_path, local_files_only=True)
        self.model.to(self.device)
        return self

    def get_class_probabilities(self, text: str, temperature: float = 1.0) -> torch.Tensor:
        inputs = self.tokenizer(text, return_tensors="pt", padding=True,
                                truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            logits = self.model(**inputs).logits
        scaled_logits = logits / temperature
        return softmax(scaled_logits, dim=-1)

    def get_scores(self, text: str, temperature: float = 1.0) -> Dict[str, float]:
        probabilities = self.get_class_probabilities(text, temperature)
        return {
            "jailbreak_score": probabilities[0, 2].item(),
            "indirect_injection_score": (probabilities[0, 1] + probabilities[0, 2]).item()
        }


@app.post("/check_security")
async def check_security(request: TextRequest):
    """
    Check text for both jailbreak and indirect injection attempts using the specified model
    """
    try:
        model = PromptGuardModel()
        model.load_model()
        scores = model.get_scores(request.text, request.temperature)
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9001)
