import os
import google.generativeai as genai
import instructor
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Tuple, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables
HELICONE_API_KEY: Optional[str] = os.getenv("HELICONE_API_KEY")
GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
USER_ID: Optional[str] = os.getenv("USER_ID")

# Define a Pydantic model for structured output


class Movie(BaseModel):
    title: str = Field(description="The title of the movie")
    year: int = Field(description="The year the movie was released")
    director: str = Field(description="The director of the movie")
    rating: float = Field(
        description="The rating of the movie on a scale of 1-10")


class MovieList(BaseModel):
    movies: List[Movie] = Field(description="List of movies")


def setup_gemini_client(user_id: Optional[str] = None) -> Any:
    """Configure the Gemini client with Helicone integration

    Args:
        user_id: Optional user ID to associate with requests

    Returns:
        An instructor-wrapped Gemini client
    """
    # Configure the Gemini client
    metadata: List[Tuple[str, str]] = [
        ("helicone-auth", f"Bearer {HELICONE_API_KEY}"),
        ("helicone-target-url", "https://generativelanguage.googleapis.com"),
    ]

    # Add user_id if provided
    if user_id:
        metadata.append(("helicone-user-id", user_id))

    genai.configure(
        api_key=GEMINI_API_KEY,
        client_options={
            "api_endpoint": "gateway.helicone.ai",
        },
        default_metadata=metadata,
        transport="rest",
    )

    # Create the Gemini model with instructor
    gemini_client = instructor.from_gemini(
        genai.GenerativeModel(
            model_name="gemini-2.0-flash",
        ),
        mode=instructor.Mode.GEMINI_JSON,
    )

    return gemini_client


def run_completion(
    client: Any,
    system_msg: str,
    human_msg: str,
    output_structure: type[BaseModel]
) -> BaseModel:
    """Run a completion

    Args:
        client: The instructor-wrapped Gemini client
        system_msg: The system message to send
        human_msg: The user message to send
        output_structure: The Pydantic model to use for structured output

    Returns:
        A structured response based on the provided output_structure
    """
    # Set up the configuration
    config: Dict[str, Any] = {
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": human_msg},
        ],
        "response_model": output_structure,
    }

    # Make the API call
    response = client.chat.completions.create(**config)
    return response


def main() -> None:
    """Main function to demonstrate Gemini with Helicone and user_id"""
    # Define messages
    system_message: str = "You are a helpful assistant that provides information about movies."
    user_message: str = "List 3 classic sci-fi movies from the 1980s."

    print("\n=== Running without user_id ===")
    # Set up the client without user_id
    client_without_user_id = setup_gemini_client()

    # Run without user_id
    response_without_user_id: MovieList = run_completion(
        client=client_without_user_id,
        system_msg=system_message,
        human_msg=user_message,
        output_structure=MovieList
    )
    print(f"Response without user_id: {response_without_user_id}")

    print("\n=== Running with user_id ===")
    # Set up the client with user_id
    client_with_user_id = setup_gemini_client(user_id=USER_ID)

    # Run with user_id
    response_with_user_id: MovieList = run_completion(
        client=client_with_user_id,
        system_msg=system_message,
        human_msg=user_message,
        output_structure=MovieList
    )
    print(f"Response with user_id: {response_with_user_id}")

    # Verify the difference
    print("\nBoth responses should be functionally identical, but the second one")
    print("will be associated with the user_id in the Helicone dashboard.")
    print(f"\nUser ID used: {USER_ID}")


if __name__ == "__main__":
    main()
