import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

def iqr_outliers(df: pd.DataFrame, col: str):
    if not pd.api.types.is_numeric_dtype(df[col]):
        return []
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    outlier_idx = df[(df[col] < lower_bound) | (df[col] > upper_bound)].index
    return list(outlier_idx)

def zscore_outliers(df: pd.DataFrame, col: str, threshold: float = 3.0):
    if not pd.api.types.is_numeric_dtype(df[col]):
        return []
    mean = df[col].mean()
    std = df[col].std()
    if std == 0:
        return []
    z_scores = (df[col] - mean) / std
    outlier_idx = df[np.abs(z_scores) > threshold].index
    return list(outlier_idx)

def isolation_forest_outliers(df: pd.DataFrame, numeric_cols: list, contamination: float = 0.05):
    if not numeric_cols:
        return []
    # Drop NaNs before fitting Isolation Forest
    temp_df = df[numeric_cols].dropna()
    if len(temp_df) < 2:
        return []
    # contamination is now adaptive (passed from detect_ai_anomalies)
    # instead of a hard-coded 0.05 constant
    iso = IsolationForest(contamination=contamination, random_state=42)
    preds = iso.fit_predict(temp_df)
    outlier_idx = temp_df[preds == -1].index
    return list(outlier_idx)


def detect_ai_anomalies(df: pd.DataFrame) -> dict:
    """
    High-level AI anomaly detection using Isolation Forest.

    Isolation Forest is an unsupervised ML model that detects anomalies by
    randomly partitioning the feature space. Anomalous rows require fewer
    splits to isolate, so they receive a lower anomaly score. This catches
    *multivariate* anomalies — rows where the combination of values is
    unusual even if each individual value looks normal — which per-column
    IQR/Z-score methods cannot detect.

    Args:
        df: Input DataFrame (pre-cleaning snapshot).

    Returns:
        dict with:
            - 'indices'      : list of row indices the model flagged
            - 'count'        : number of anomalous rows detected
            - 'numeric_cols' : numeric columns the model was trained on
            - 'pct'          : percentage of total rows flagged (rounded, 2 dp)
    """
    # Identify numeric columns available for the model
    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    total_rows = len(df)

    # Need at least one numeric column and at least 2 rows to train
    if not numeric_cols or total_rows < 2:
        return {
            "indices": [],
            "count": 0,
            "numeric_cols": numeric_cols,
            "pct": 0.0,
            "contamination": 0.05
        }

    # ── Adaptive Contamination ────────────────────────────────────────────
    # Instead of a fixed contamination rate (e.g. 0.05), we estimate the
    # real outlier rate from the data using IQR detection across all numeric
    # columns. Rows flagged by at least one column's IQR test form the basis
    # of the estimate. The result is clipped to [0.01, 0.20] to keep the
    # model stable on very clean or very dirty datasets.
    iqr_outlier_rows: set = set()
    for col in numeric_cols:
        iqr_outlier_rows.update(iqr_outliers(df, col))

    estimated_rate = len(iqr_outlier_rows) / total_rows
    # Fall back to 0.05 if IQR finds nothing (clean dataset)
    contamination = float(np.clip(
        estimated_rate if estimated_rate > 0 else 0.05,
        0.01, 0.20
    ))
    # ─────────────────────────────────────────────────────────────────────

    indices = isolation_forest_outliers(df, numeric_cols, contamination=contamination)
    count = len(indices)
    pct = round((count / total_rows) * 100, 2) if total_rows > 0 else 0.0

    return {
        "indices": indices,
        "count": count,
        "numeric_cols": numeric_cols,
        "pct": pct,
        "contamination": round(contamination, 4)
    }
