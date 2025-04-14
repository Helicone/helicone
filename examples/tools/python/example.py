from helicone_helpers import HeliconeManualLogger
import requests
import os
import json
from datetime import datetime

# Initialize the Helicone logger
helicone_api_key = os.environ.get("HELICONE_API_KEY", "your-helicone-api-key")
helicone_logger = HeliconeManualLogger(
    api_key=helicone_api_key,
    headers={"Helicone-Auth": f"Bearer {helicone_api_key}"}
)

# Example 1: Weather API tool


def get_weather_example():
    def weather_tool_operation(result_recorder):
        try:
            # Access the request data
            location = result_recorder.request["input"]["location"]

            # Option 1: Use a real Weather API if you have an API key
            # Uncomment and use this if you have a WeatherAPI.com API key
            """
            api_key = os.environ.get("WEATHER_API_KEY")
            if api_key:
                response = requests.get(
                    f"https://api.weatherapi.com/v1/current.json?key={api_key}&q={location}"
                )
                
                if response.status_code == 200:
                    weather_data = response.json()
                    result = {
                        "temperature": weather_data["current"]["temp_c"],
                        "condition": weather_data["current"]["condition"]["text"],
                        "humidity": weather_data["current"]["humidity"],
                        "location": weather_data["location"]["name"]
                    }
                    result_recorder.append_results(result)
                    return result
            """

            # Option 2: Use a mock response for demonstration purposes
            # This ensures the example works without requiring API keys
            mock_weather_data = {
                "temperature": 18.5,
                "condition": "Partly cloudy",
                "humidity": 72,
                "location": location,
                "timestamp": datetime.now().isoformat(),
                "is_mock": True
            }

            # Log the results to Helicone
            result_recorder.append_results(mock_weather_data)
            return mock_weather_data

        except Exception as e:
            error = {
                "error": f"Failed to get weather: {str(e)}", "is_mock": True}
            result_recorder.append_results(error)
            return error

    # Log the request with Helicone
    return helicone_logger.log_request(
        request={
            "_type": "tool",
            "toolName": "weather_api",
            "input": {
                "location": "San Francisco",
                "units": "metric"
            }
        },
        operation=weather_tool_operation,
        additional_headers={
            "Helicone-Property-Session-Id": "weather-demo-session",
            "Helicone-Property-User-Id": "user-123"
        }
    )

# Example 2: Database query tool


def database_query_example():
    def db_query_operation(result_recorder):
        try:
            # In a real application, this would be a database query
            # For this example, we'll simulate a query result
            query = result_recorder.request["input"]["query"]

            # Simulate database operation
            if "users" in query.lower():
                result = {
                    "rows": [
                        {"id": 1, "name": "Alice", "email": "alice@example.com"},
                        {"id": 2, "name": "Bob", "email": "bob@example.com"}
                    ],
                    "query_time_ms": 42,
                    "is_mock": True
                }
            else:
                result = {
                    "rows": [],
                    "query_time_ms": 15,
                    "is_mock": True
                }

            # Log the results to Helicone
            result_recorder.append_results(result)
            return result
        except Exception as e:
            error = {
                "error": f"Database query failed: {str(e)}", "is_mock": True}
            result_recorder.append_results(error)
            return error

    # Log the request with Helicone
    return helicone_logger.log_request(
        request={
            "_type": "tool",
            "toolName": "database_query",
            "input": {
                "query": "SELECT * FROM users LIMIT 10",
                "database": "production"
            }
        },
        operation=db_query_operation
    )

# Example 3: Document search tool


def document_search_example():
    def search_operation(result_recorder):
        try:
            # Access the search query from the request
            query = result_recorder.request["input"]["query"]

            # In a real application, this would search a document database
            # For this example, we'll return mock results
            mock_results = {
                "results": [
                    {
                        "document_id": "doc-123",
                        "title": "Introduction to Helicone",
                        "snippet": f"...contains information about {query}...",
                        "relevance_score": 0.92
                    },
                    {
                        "document_id": "doc-456",
                        "title": "Advanced Tool Logging",
                        "snippet": f"...examples of {query} implementation...",
                        "relevance_score": 0.85
                    }
                ],
                "search_time_ms": 156,
                "is_mock": True
            }

            # Log the results to Helicone
            result_recorder.append_results(mock_results)
            return mock_results
        except Exception as e:
            error = {
                "error": f"Document search failed: {str(e)}", "is_mock": True}
            result_recorder.append_results(error)
            return error

    # Log the request with Helicone
    return helicone_logger.log_request(
        request={
            "_type": "tool",
            "toolName": "document_search",
            "input": {
                "query": "tool logging",
                "max_results": 5,
                "min_relevance": 0.8
            }
        },
        operation=search_operation,
        additional_headers={
            "Helicone-Property-Tool-Category": "search",
            "Helicone-Property-User-Id": "user-123"
        }
    )


if __name__ == "__main__":
    print("\n=== Helicone Tool Logging Examples ===\n")

    print("1. Weather API Example:")
    weather_result = get_weather_example()
    print(json.dumps(weather_result, indent=2))
    print("\n" + "-"*50 + "\n")

    print("2. Database Query Example:")
    db_result = database_query_example()
    print(json.dumps(db_result, indent=2))
    print("\n" + "-"*50 + "\n")

    print("3. Document Search Example:")
    search_result = document_search_example()
    print(json.dumps(search_result, indent=2))

    print("\n=== All examples successfully logged to Helicone ===")
    print("Note: These examples use mock data. To use real APIs, update the code with your API keys.")
