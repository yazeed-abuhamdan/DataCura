import pandas as pd
import numpy as np
from typing import Any
from profiling import infer_column_types, null_percentages
from anomaly_detection import iqr_outliers, zscore_outliers


def load_dataset(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


def profile_dataset(df: pd.DataFrame) -> dict:
    return {
        "types": infer_column_types(df),
        "null_percentages": null_percentages(df)
    }


def detect_missing_values(df: pd.DataFrame) -> dict:
    missing = df.isnull().sum()
    return {col: int(count) for col, count in missing.items() if count > 0}


def detect_outliers(df: pd.DataFrame, method: str = "iqr") -> dict:
    outliers: dict[str, int] = {}
    for col in df.select_dtypes(include=['number']).columns:
        if method == "iqr":
            idx = iqr_outliers(df, col)
        elif method == "zscore":
            idx = zscore_outliers(df, col)
        else:
            idx = []
        if idx:
            outliers[col] = len(idx)
    return outliers


def detect_duplicates(df: pd.DataFrame) -> dict:
    duplicates = df.duplicated().sum()
    return {"total_duplicates": int(duplicates)}


def correct_data_types(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Attempt to coerce columns to better types. E.g., parse date-like strings."""
    report: dict[str, Any] = {"type_corrections": 0, "actions": []}
    cleaned_df = df.copy()

    for col in cleaned_df.select_dtypes(include=["object"]).columns:
        # Try to convert to numeric
        converted = pd.to_numeric(cleaned_df[col], errors="coerce")
        if converted.notna().sum() > 0 and cleaned_df[col].notna().sum() > 0:
            ratio = converted.notna().sum() / cleaned_df[col].notna().sum()
            if ratio > 0.8:  # >80% parseable as number
                cleaned_df[col] = converted
                report["type_corrections"] = int(report["type_corrections"]) + 1
                report["actions"].append({
                    "action": "Convert to numeric",
                    "column": col,
                    "reason": f"{ratio:.0%} of values are numeric",
                    "before": "string",
                    "after": "number"
                })

    return cleaned_df, report


def generate_explainability_report(report: dict) -> dict:
    """Return the report dict as-is (can be extended for richer formatting)."""
    return report


def clean_dataset(df: pd.DataFrame, config: dict | None = None) -> tuple[pd.DataFrame, dict]:
    report: dict[str, Any] = {
        "missing_values_fixed": 0,
        "duplicates_removed": 0,
        "outliers_detected": 0,
        "outliers_handled": 0,
        "type_corrections": 0,
        "actions": []
    }

    cleaned_df = df.copy()

    # 1. Handle Duplicates
    dup_count = int(cleaned_df.duplicated().sum())
    if dup_count > 0:
        cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
        report["duplicates_removed"] = dup_count
        report["actions"].append({
            "action": "Drop duplicates",
            "column": "All",
            "reason": "Found exact duplicate rows",
            "before": f"{dup_count} duplicates",
            "after": "0 duplicates"
        })

    # 2. Handle Missing Values
    for col in cleaned_df.columns:
        missing_count = int(cleaned_df[col].isnull().sum())
        if missing_count > 0:
            if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                fill_val = cleaned_df[col].median()
                strategy = "median"
            else:
                mode_vals = cleaned_df[col].mode()
                fill_val = mode_vals[0] if not mode_vals.empty else "Unknown"
                strategy = f'mode ("{fill_val}")'

            cleaned_df[col] = cleaned_df[col].fillna(fill_val)
            report["missing_values_fixed"] = int(report["missing_values_fixed"]) + missing_count
            report["actions"].append({
                "action": f"Fill missing values with {strategy}",
                "column": col,
                "reason": "Missing data detected",
                "before": f"{missing_count} missing",
                "after": "0 missing"
            })

    # 3. Handle Outliers (IQR capping)
    outliers_dict = detect_outliers(cleaned_df, method="iqr")
    for col, count in outliers_dict.items():
        report["outliers_detected"] = int(report["outliers_detected"]) + count
        Q1 = float(cleaned_df[col].quantile(0.25))
        Q3 = float(cleaned_df[col].quantile(0.75))
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        cleaned_df[col] = cleaned_df[col].clip(lower=lower_bound, upper=upper_bound)
        report["outliers_handled"] = int(report["outliers_handled"]) + count
        report["actions"].append({
            "action": "Cap outliers (IQR)",
            "column": col,
            "reason": "Values beyond IQR bounds detected",
            "before": f"{count} outliers",
            "after": "Capped to IQR bounds"
        })

    return cleaned_df, generate_explainability_report(report)
