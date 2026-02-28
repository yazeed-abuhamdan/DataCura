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

def isolation_forest_outliers(df: pd.DataFrame, numeric_cols: list):
    if not numeric_cols:
        return []
    # Drop NaNs before fitting Isolation Forest
    temp_df = df[numeric_cols].dropna()
    if len(temp_df) < 2:
        return []
    iso = IsolationForest(contamination=0.05, random_state=42)
    preds = iso.fit_predict(temp_df)
    outlier_idx = temp_df[preds == -1].index
    return list(outlier_idx)
