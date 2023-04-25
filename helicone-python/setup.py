from setuptools import setup, find_packages

setup(
    name="helicone",
    version="0.1.0",
    description="A Python wrapper for the OpenAI API that logs all requests to Helicone.",
    author="Helicone, Inc.",
    author_email="help@helicone.ai",
    packages=find_packages(),
    install_requires=[
        "openai",
    ],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)