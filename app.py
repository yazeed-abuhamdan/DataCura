"""
Data Cura — Hybrid AI Cleaning API
====================================
FastAPI server that exposes the Python cleaning pipeline to the React UI.

Run from the AiModule directory:
    python app.py          (or: uvicorn app:app --reload --port 8001)

Endpoints:
    POST /api/clean   →  accepts raw JSON dataset, returns cleaned data + report
"""

import sys
import os
import math
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure local modules (data_cleaner, anomaly_detection, …) are importable
# regardless of where the server is launched from.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_cleaner import clean_dataset, clean_selected_columns
from explainability import format_explanations

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Data Cura Cleaning API",
    description="Hybrid AI + rule-based data cleaning pipeline",
    version="1.0.0"
)

# Allow requests from the Vite dev server (ports 5173 and 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    """Quick health-check so the frontend can verify the server is up."""
    return {"status": "ok", "service": "Data Cura Cleaning API"}


@app.post("/api/clean")
async def clean_data(body: dict):
    """
    Run the full hybrid AI + rule-based cleaning pipeline on a raw dataset.

    Request body (JSON):
        { "data": [ { "col1": val, "col2": val, ... }, ... ] }

    Response:
        {
            "cleaned_data": [ { ... }, ... ],   # array of cleaned row objects
            "report": {                          # full cleaning report
                "missing_values_fixed": int,
                "duplicates_removed":   int,
                "outliers_detected":    int,
                "outliers_handled":     int,
                "type_corrections":     int,
                "ai_anomalies_detected":int,
                "ai_anomalies_pct":     float,
                "ai_anomaly_handling":  str,
                "ai_contamination_used":float,
                "actions": [ { column, action, before, after, reason } ]
            },
            "summary": [ "string", ... ]         # human-readable explanations
        }
    """
    data = body.get("data", [])
    config = body.get("config", {})
    selected_columns = config.get("selected_columns", [])

    if not data:
        return {
            "cleaned_data": [],
            "report": {},
            "summary": ["No data provided — nothing to clean."]
        }

    try:
        # Reconstruct DataFrame from the JSON rows sent by the frontend
        df = pd.DataFrame(data)

        # ── Step A : Hybrid AI Pipeline (KNN imputation) ─────────────────
        # Auto-detect every numeric column that has at least one missing value.
        # The frontend sends config:{} (no selected_columns), so we must derive
        # the target columns ourselves — otherwise KNN is never applied.
        numeric_cols_with_missing = [
            col for col in df.select_dtypes(include=[np.number]).columns
            if df[col].isna().any()
        ]
        knn_cols = selected_columns if selected_columns else numeric_cols_with_missing
        if knn_cols:
            df = clean_selected_columns(df, knn_cols)

        # ── Step B : Run the Generic pipeline ───────────────────────
        # Step 1 : Duplicate removal
        # Step 2 : Remaining generic Missing Values / Mode (categorical)
        # Step 3 : IQR outlier capping
        cleaned_df, report = clean_dataset(df)

        # Generate human-readable explanation list
        summary = format_explanations(report)

        # ── Safe JSON conversion ──────────────────────────────────────────
        # FastAPI's default JSON encoder cannot handle numpy scalars (int64,
        # float64) or float NaN/Inf.  Walk the entire response recursively
        # and convert everything to native Python types.
        def safe_convert(obj):
            if isinstance(obj, dict):
                return {k: safe_convert(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [safe_convert(v) for v in obj]
            # numpy scalar → python scalar
            if isinstance(obj, (np.integer,)):
                return int(obj)
            if isinstance(obj, (np.floating,)):
                obj = float(obj)
            if isinstance(obj, float):
                # NaN / Inf → None so JSON doesn't break
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return obj
            if isinstance(obj, np.ndarray):
                return safe_convert(obj.tolist())
            if isinstance(obj, np.bool_):
                return bool(obj)
            return obj

        # Convert cleaned DataFrame → list of row dicts, NaN → None
        cleaned_data = safe_convert(
            cleaned_df.where(pd.notna(cleaned_df), other=None).to_dict(orient="records")
        )

        return {
            "cleaned_data": cleaned_data,
            "report": safe_convert(report),
            "summary": summary
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Entry-point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # Port 8001 keeps this separate from the security API on port 8000
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
