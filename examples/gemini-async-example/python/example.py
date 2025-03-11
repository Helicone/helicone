async def async_gemini_api_call_with_backoff_and_timeout(model_name, user_id, **kwargs):

    model_provider_to_use = helper_methods.get_model_provider_name(model_name)

    prompt_messages = kwargs.get('messages', [])
    for message in prompt_messages:
        if "content" in message:
            message["content"] = re.sub(
                r'\s{2,}', ' ', message["content"].strip())

    try:

        sentry_sdk.set_user({"id": user_id})

        gemini_model = GenerativeModel(model_name)

        if kwargs.get('json_mode', None) is True:
            gemini_model = GenerativeModel(
                model_name,
                generation_config={"response_mime_type": "application/json"},
            )

        safety_config = [
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=HarmBlockThreshold.BLOCK_NONE,
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=HarmBlockThreshold.BLOCK_NONE,
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=HarmBlockThreshold.BLOCK_NONE,
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold=HarmBlockThreshold.BLOCK_NONE,
            ),
            SafetySetting(
                category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=HarmBlockThreshold.BLOCK_NONE,
            ),
        ]

        if kwargs.get('image_bytes', None):
            vertex_image = Part.from_image(
                Image.from_bytes(kwargs.get('image_bytes')))
            initial_message = prompt_messages[0]['content']
            try:
                from helicone_helpers import HeliconeManualLogger, LoggingOptions
                import json
                helicone = HeliconeManualLogger(
                    api_key="your-helicone-api-key")

                gen_kwargs = {
                    "contents": [vertex_image, initial_message],
                    "safety_settings": safety_config
                }

                start_time = time.time()
                response = await asyncio.wait_for(gemini_model.generate_content_async(**gen_kwargs), timeout=10)
                end_time = time.time()
                helicone.send_log(
                    provider=None,  # Custom provider
                    request=gen_kwargs,
                    response=json.dumps(response),  # String response
                    options=LoggingOptions(
                        start_time=start_time,
                        end_time=end_time,
                    )
                )

                return response, "success"
            except asyncio.TimeoutError:
                return "timeout", "timeout"
            except Exception as e:
                return e, "error"

    except Exception as e:
        sentry_sdk.capture_exception(e)
        return str(e), "error"
