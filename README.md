# CWA 台灣氣象觀測與預報平台

一個可維護的台灣氣象資料平台，用於抓取中央氣象署 (CWA) 的 OpenData 開放資料、將標準化的氣象記錄儲存至 SQLite 資料庫、提供 FastAPI 介面，並使用 MapLibre GL JS 進行地圖視覺化呈現。

## 專案功能與範疇 (MVP Scope)

- 從氣象署 REST API 獲取氣象資料。
- 儲存原始 JSON 快照以及標準化後的氣報記錄。
- 將資料儲存至 `weather.db` 資料庫。
- 提供 FastAPI 介面（包含最新預報、測站、縣市清單、歷史紀錄以及系統健康檢查）。
- 確保氣象署 API 金鑰僅保留於伺服器端，不外流至前端。

## 快速開始 (Quick Start)

```bash
# 建立虛擬環境
python -m venv .venv
.venv\Scripts\activate

# 安裝依賴套件
pip install -r requirements.txt

# 建立環境設定檔並設定您的氣象署 API 金鑰
copy .env.example .env

# 初始化資料庫結構
python scripts/init_db.py

# 執行爬蟲抓取資料
python scripts/run_crawler.py

# 啟動後端 FastAPI 伺服器
uvicorn api.main:app --reload
```

## 環境變數設定 (Environment Variables)

請於 `.env` 中設定以下環境變數：

```env
CWA_API_KEY=您的氣象署API金鑰
CWA_DATASET_ID=F-D0047-091
DATABASE_PATH=weather.db
RAW_DATA_DIR=raw
```

## 系統架構 (Architecture)

```text
氣象署 CWA API
  -> 儲存原始 JSON 快照
  -> 資料標準化與解析層 (Normalization Layer)
  -> 寫入 SQLite weather.db 資料庫
  -> 提供 FastAPI 介面服務
  -> 前端網頁地圖視覺化 (MapLibre GL JS)
```
