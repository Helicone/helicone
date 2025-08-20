HOW TO RUN MIGRATIONS

```bash
python3 -m venv venv
source venv/bin/activate # [.fish]

python3 -m pip install tabulate yarl
python3 clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
```
