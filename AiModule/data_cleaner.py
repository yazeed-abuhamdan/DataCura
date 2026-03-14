import pandas as pd
import numpy as np
from typing import Any
from profiling import infer_column_types, null_percentages
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

    # ── Step 0: AI Anomaly Detection (Isolation Forest) ──────────────────
    # Run BEFORE rule-based steps so the AI model sees the original data
    # distribution. Isolation Forest detects rows that are anomalous in the
    # *multivariate* numeric feature space — patterns that per-column
    # IQR/Z-score methods cannot detect (e.g., a combination of values that
    # is individually normal but collectively anomalous).
    #
    # Handling strategy: clip the numeric values in AI-flagged rows to their
    # per-column IQR bounds. This resolves multivariate anomalies before the
    # rule-based IQR pass, so the two methods are complementary rather than
    # redundant.
    ai_result = detect_ai_anomalies(cleaned_df)
    ai_count = ai_result["count"]
    ai_pct = ai_result["pct"]
    ai_indices = ai_result["indices"]
    ai_numeric_cols = ai_result["numeric_cols"]
    ai_contamination = ai_result.get("contamination", 0.05)  # adaptive rate

    report["ai_anomalies_detected"] = ai_count
    report["ai_anomalies_pct"] = ai_pct
    report["ai_contamination_used"] = ai_contamination

    if ai_count > 0 and ai_numeric_cols:
        # Clip each numeric column of AI-flagged rows to IQR bounds
        for col in ai_numeric_cols:
            Q1 = float(cleaned_df[col].quantile(0.25))
            Q3 = float(cleaned_df[col].quantile(0.75))
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            cleaned_df.loc[ai_indices, col] = (
                cleaned_df.loc[ai_indices, col].clip(lower=lower, upper=upper)
            )

        report["ai_anomaly_handling"] = "capped to IQR bounds"
        report["actions"].append({
            "action": "AI Anomaly Detection (Isolation Forest)",
            "column": ", ".join(ai_numeric_cols),
            "reason": (
                f"Isolation Forest flagged {ai_count} row(s) ({ai_pct}%) "
                f"as multivariate anomalies (adaptive contamination: {ai_contamination})"
            ),
            "before": f"{ai_count} anomalous row(s)",
            "after": "Numeric values capped to per-column IQR bounds"
        })
    else:
        report["ai_anomaly_handling"] = "none"
    # ─────────────────────────────────────────────────────────────────────

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
    # ── Numeric columns: adaptive imputation ─────────────────────────────
    # KNN Imputation is highly accurate but O(n²) — too slow for large
    # datasets. We use a size threshold:
    #   ≤ KNN_ROW_LIMIT rows  → KNNImputer  (AI, uses neighbour similarity)
    #   >  KNN_ROW_LIMIT rows → median      (fast, rule-based fallback)
    KNN_ROW_LIMIT = 5_000

    all_numeric_cols = list(cleaned_df.select_dtypes(include=[np.number]).columns)
    numeric_missing_cols = [
        col for col in all_numeric_cols if cleaned_df[col].isnull().sum() > 0
    ]
    missing_counts_before = {
        col: int(cleaned_df[col].isnull().sum()) for col in numeric_missing_cols
    }

    use_knn = len(cleaned_df) <= KNN_ROW_LIMIT

    if numeric_missing_cols:
        if use_knn:
            # ── KNN Imputation (AI) — small/medium datasets ───────────────
            n_neighbors = min(5, max(1, len(cleaned_df) - 1))
            knn = KNNImputer(n_neighbors=n_neighbors, weights="distance")
            imputed_array = knn.fit_transform(cleaned_df[all_numeric_cols])
            cleaned_df[all_numeric_cols] = imputed_array

            for col in numeric_missing_cols:
                mc = missing_counts_before[col]
                report["missing_values_fixed"] = int(report["missing_values_fixed"]) + mc
                report["actions"].append({
                    "action": "Fill missing values with KNN Imputation (AI)",
                    "column": col,
                    "reason": (
                        f"KNN (k={n_neighbors}) estimates missing numeric values "
                        "from the most similar rows using all numeric features"
                    ),
                    "before": f"{mc} missing",
                    "after": "0 missing"
                })
        else:
            # ── Median imputation — large datasets (> 5 000 rows) ─────────
            # KNN is O(n²) and would be too slow; median is instant.
            for col in numeric_missing_cols:
                mc = missing_counts_before[col]
                fill_val = cleaned_df[col].median()
                cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                report["missing_values_fixed"] = int(report["missing_values_fixed"]) + mc
                report["actions"].append({
                    "action": "Fill missing values with median (large dataset)",
                    "column": col,
                    "reason": (
                        f"Dataset has {len(cleaned_df)} rows — median used "
                        f"instead of KNN for performance (threshold: {KNN_ROW_LIMIT})"
                    ),
                    "before": f"{mc} missing",
                    "after": "0 missing"
                })

    # ── Categorical columns: Mode imputation (rule-based, unchanged) ──────
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
