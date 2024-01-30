# How to run tests

## 1. Start workers

Go to worker directory and run the script

```bash
chmod +x run_um.sh
./run_um.sh
```

## 2. Install dependencies

Come back to tests directory and install dependencies

```bash
pip install requests pytest psycopg2 python-dotenv helicone
```

## 3. Run tests

Run in tests directory

```bash
pytest python_integration_tests.py
```
