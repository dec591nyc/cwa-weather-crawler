from database.init_db import init_db
from crawler.service import run_crawler

if __name__ == "__main__":
    init_db()
    count = run_crawler()
    print(f"Saved {count} forecast records into weather.db")
