from helicone.globals.helicone import helicone_global
from helicone.runs import HeliconeJob, HeliconeNodeConfig
from helicone.openai_async import openai, Meta
import json
COURSE_FUNCTIONS = [
    {
        "name": "generate_course_outline",
        "description": "Generate a course outline",
        "parameters": {
            "type": "object",
            "properties": {
                "Description": {
                    "type": "string",
                    "description": "The course description"
                },
                "chapters": {
                    "type": "array",
                    "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "The name of the chapter"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "The description of the chapter"
                                },
                            },
                        "required": ["name", "description"]
                    },
                    "description": "The chapters of the course",
                    "minItems": 1,
                    "maxItems": 10
                }
            },
            "required": ["Description", "chapters"]
        },

    }
]

CHAPTER_FUNCTIONS = [
    {
        "name": "generate_chapter_outline",
        "description": "Generate a chapter outline",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the chapter"
                },
                "description": {
                    "type": "string",
                    "description": "The description of the chapter"
                },
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The name of the section"
                            },
                            "description": {
                                "type": "string",
                                "description": "The description of the section"
                            },
                        },
                        "required": ["name", "description"]
                    },
                    "description": "The sections of the chapter",
                    "minItems": 1,
                    "maxItems": 10
                }
            },
            "required": ["name", "description", "sections"]
        },
    }
]


helicone_global.fail_on_error = True
helicone_global.base_url = "http://127.0.0.1:8788"
helicone_global.api_key = "sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa"
helicone_global.proxy_url = "http://127.0.0.1:8787/v1"


def test_run_creation():
    generate_course = HeliconeJob(
        name="Generate Entire Course",
    )
    try:

        TOPIC = "Artificial Intelligence"

        create_course_outline = generate_course.create_node(
            HeliconeNodeConfig(
                name="Create Course Outline",
                description="Small task to create a course outline",
            )
        )

        _course_outline = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": f"Generate a course outline on {TOPIC}"}
            ],
            functions=COURSE_FUNCTIONS,
            max_tokens=512,
            heliconeMeta=Meta(
                node_id=create_course_outline.id,
                retry=True,
                cache=True,
            ),
            user="alice@bob.com"
        )

        course_outline = json.loads(
            _course_outline.choices[0].message.function_call.arguments)

        create_chapters = create_course_outline.create_child_node(
            HeliconeNodeConfig(
                name="Create Chapters",
                description="Generates each chapter from the course outline",
            )
        )

        chapters = []
        for chapter in course_outline["chapters"]:
            _chapter = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "user",
                        "content": f"Generate a chapter outline on {chapter['name']}, with description {chapter['description']}"}
                ],
                functions=CHAPTER_FUNCTIONS,
                max_tokens=512,
                user="alice@bob.com",
                heliconeMeta=Meta(
                    node_id=create_chapters.id,
                ),
            )
            chapter = json.loads(
                _chapter.choices[0].message.function_call.arguments)
            chapters.append(chapter)
            print(chapter)

        generate_course.success()

    except Exception as e:
        generate_course.fail()
        raise e
