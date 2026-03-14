import pandas as pd
import numpy as np
from typing import Any
from profiling import infer_column_types, null_percentages
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.impute import KNNImputer
from anomaly_detection import iqr_outliers, zscore_outliers, detect_ai_anomalies


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
        # ── AI fields (new) ──────────────────────────────────────────────
        # These are added for backward compatibility: existing UI keys are
        # unchanged; the UI simply ignores keys it does not consume.
        "ai_anomalies_detected": 0,    # rows flagged by Isolation Forest
        "ai_anomalies_pct": 0.0,       # percentage of total rows flagged
        "ai_anomaly_handling": "none", # how flagged rows were handled
        "ai_contamination_used": 0.0,  # adaptive contamination rate used
        # ─────────────────────────────────────────────────────────────────
        "actions": []
    }

    cleaned_df = df.copy()

    # (AI Anomaly Detection and KNN Imputation are now handled strictly via clean_selected_columns
    # for user chosen properties before reaching this generic function.)

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
    # ── Missing values for generic numeric features are handled explicitly via ──
    # ── clean_selected_columns prior to this step. We only process categoricals.
    for col in cleaned_df.select_dtypes(exclude=[np.number]).columns:
        missing_count = int(cleaned_df[col].isnull().sum())
        if missing_count > 0:
            mode_vals = cleaned_df[col].mode()
            fill_val = mode_vals[0] if not mode_vals.empty else "Unknown"
            strategy = f'mode ("{fill_val}")'
            cleaned_df[col] = cleaned_df[col].fillna(fill_val)
            report["missing_values_fixed"] = int(report["missing_values_fixed"]) + missing_count
            report["actions"].append({
                "action": f"Fill missing values with {strategy}",
                "column": col,
                "reason": "Missing categorical data detected",
                "before": f"{missing_count} missing",
                "after": "0 missing"
            })
    # ─────────────────────────────────────────────────────────────────────

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


def clean_selected_columns(df: pd.DataFrame, selected_columns: list) -> pd.DataFrame:
    """
    Fill missing numeric values using KNN imputation.
    Existing valid values are NEVER overwritten — only NaN cells are filled.
    Operates only on numeric columns in `selected_columns` that actually exist.
    """
    cleaned_df = df.copy()

    # 1. Keep only columns that exist AND are (or can be coerced to) numeric
    cols_to_clean = [col for col in selected_columns if col in cleaned_df.columns]
    if not cols_to_clean:
        return cleaned_df

    # 2. Coerce to numeric — non-numeric values become NaN
    for col in cols_to_clean:
        cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")

    numeric_cols = [
        col for col in cols_to_clean
        if pd.api.types.is_numeric_dtype(cleaned_df[col])
    ]
    if not numeric_cols:
        return cleaned_df

    # 3. Record which rows are missing BEFORE imputation (per column)
    #    We use these masks to ensure we only fill originally-missing cells.
    missing_masks = {col: cleaned_df[col].isna() for col in numeric_cols}

    # Skip columns where every value is already present (nothing to impute)
    cols_needing_imputation = [col for col in numeric_cols if missing_masks[col].any()]
    if not cols_needing_imputation:
        return cleaned_df

    # 4. Handle edge-case: columns that are 100 % NaN cannot be used as KNN
    #    features — fill with 0 so imputer doesn't crash, but don't include
    #    them as target columns.
    for col in numeric_cols:
        if cleaned_df[col].isna().all():
            cleaned_df[col] = 0.0
            cols_needing_imputation = [c for c in cols_needing_imputation if c != col]

    if not cols_needing_imputation:
        return cleaned_df

    # 5. Apply KNNImputer directly on the raw numeric values.
    #    Optimization for speed: KNN algorithms scale O(N^2). For 20k rows this is too slow.
    #    We limit n_neighbors to 3. For large datasets, we fit the imputer ONLY on
    #    a small random sample (up to 2000 rows), then transform the whole dataset O(N).
    impute_subset = cleaned_df[numeric_cols].copy()
    
    n_neighbors = min(3, len(impute_subset))
    knn = KNNImputer(n_neighbors=n_neighbors, weights="distance")

    if len(impute_subset) > 2000:
        # Try to find complete rows for training the imputer, otherwise use random rows
        complete_rows = impute_subset.dropna()
        if len(complete_rows) >= 500: # Need decent amount of complete data
            sample_for_fit = complete_rows.sample(n=min(2000, len(complete_rows)), random_state=42)
        else:
            sample_for_fit = impute_subset.sample(n=2000, random_state=42)
            
        knn.fit(sample_for_fit)
        
        # We can't transform large datasets all at once easily with KNN due to distance matrix size.
        # However, sklearn's KNNImputer transform() is O(N_test * N_train), so transforming 20k rows 
        # against 2k training rows is 40M operations (fast! <1sec) instead of 400M (slow!).
        imputed_array = knn.transform(impute_subset)
    else:
        # Small dataset, just fit_transform the whole thing
        imputed_array = knn.fit_transform(impute_subset)
        
    imputed_df = pd.DataFrame(imputed_array, columns=numeric_cols, index=cleaned_df.index)

    # 6. ONLY write back cells that were originally missing — never overwrite
    #    existing valid values.
    for col in cols_needing_imputation:
        mask = missing_masks[col]
        cleaned_df.loc[mask, col] = imputed_df.loc[mask, col]

    return cleaned_df


