import os
import uuid
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent

# Load environment variables
load_dotenv()

def main():
    """Simple hello world example with LangGraph ChatAnthropic and Helicone."""
    
    # Check if required environment variables are set
    if not os.getenv('HELICONE_API_KEY'):
        print("Error: HELICONE_API_KEY environment variable is not set.")
        print("Please set your Helicone API key in the .env file.")
        return
    
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("Error: ANTHROPIC_API_KEY environment variable is not set.")
        print("Please set your Anthropic API key in the .env file.")
        return
    
    # Generate unique IDs for this conversation
    conversation_id = str(uuid.uuid4())
    user_id = "example-user"
    model_id = "claude-3-sonnet-20240229"
    
    print("LangGraph ChatAnthropic Agent with Helicone - Hello World")
    print("=" * 60)
    print(f"Conversation ID: {conversation_id}")
    print(f"Model: {model_id}")
    print()
    
    # Initialize ChatAnthropic with Helicone proxy
    llm = ChatAnthropic(
        model=model_id,
        temperature=0,
        max_tokens=64000 if model_id == 'claude-sonnet-4-20250514' else 2000,
        streaming=True,
        **{
            "base_url": "https://anthropic.helicone.ai/",
            "default_headers": {
                "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
                "Helicone-Property-Model-Class-Name": "HelloWorldAgent",
                "Helicone-Property-Conversation-Id": conversation_id,
            }
        }
    )
    
    # Create agent without tools (empty list)
    agent = create_react_agent(llm, [])
    
    # Simple hello world message
    message = "Hello! Please introduce yourself and tell me what you can help with."
    conversation = [HumanMessage(content=message)]
    
    # Configure agent with session headers
    config = {
        "configurable": {
            "thread_id": conversation_id,
            "headers": {
                "Helicone-Session-Id": conversation_id,
                "Helicone-Session-Name": conversation_id,
                "Helicone-Session-Path": "/",
                "Helicone-User-Id": user_id
            }
        }
    }
    
    print(f"User: {message}")
    print("Agent: ", end="", flush=True)
    
    # Stream the response
    try:
        for stream_mode, chunk in agent.stream(
            {"messages": conversation}, 
            config=config, 
            stream_mode=["custom", "messages"]
        ):
            if stream_mode == "messages":
                if isinstance(chunk, AIMessage):
                    if chunk.content:
                        print(chunk.content, end="", flush=True)
        
        print()  # New line after streaming
        print("\n✅ Success! Check your Helicone dashboard to see this conversation.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 