from __future__ import annotations

from config import settings
from crawler.cwa_client import CwaClient
from crawler.normalize import normalize_f_d0047_091, now_iso
from crawler.repository import save_forecasts, save_raw_snapshot, log_fetch


def run_crawler() -> int:
    fetched_at = now_iso()
    client = CwaClient(settings.cwa_api_key, settings.cwa_dataset_id)
    try:
        raw_data, response_ms = client.fetch()
        records = normalize_f_d0047_091(raw_data, settings.cwa_dataset_id)
        save_raw_snapshot(settings.cwa_dataset_id, raw_data, fetched_at)
        count = save_forecasts(records)
        log_fetch(settings.cwa_dataset_id, fetched_at, "success", count, response_ms)
        return count
    except Exception as exc:
        log_fetch(settings.cwa_dataset_id, fetched_at, "failed", 0, None, str(exc))
        raise
