from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    cwa_api_key: str = os.getenv("CWA_API_KEY", "")
    cwa_dataset_id: str = os.getenv("CWA_DATASET_ID", "F-D0047-091")
    database_path: str = os.getenv("DATABASE_PATH", "weather.db")
    raw_data_dir: str = os.getenv("RAW_DATA_DIR", "raw")

settings = Settings()
