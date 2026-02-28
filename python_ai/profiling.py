import pandas as pd
import numpy as np

def infer_column_types(df: pd.DataFrame) -> dict:
    type_map = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            type_map[col] = 'number'
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            type_map[col] = 'date'
        elif pd.api.types.is_bool_dtype(df[col]):
            type_map[col] = 'bool'
        else:
            type_map[col] = 'string'
    return type_map

def null_percentages(df: pd.DataFrame) -> dict:
    return (df.isnull().sum() / len(df) * 100).to_dict()

def unique_counts(df: pd.DataFrame) -> dict:
    return df.nunique().to_dict()

def numeric_stats(df: pd.DataFrame) -> dict:
    stats = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        stats[col] = {
            'min': float(df[col].min()) if not pd.isna(df[col].min()) else None,
            'max': float(df[col].max()) if not pd.isna(df[col].max()) else None,
            'mean': float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
            'median': float(df[col].median()) if not pd.isna(df[col].median()) else None,
            'std': float(df[col].std()) if not pd.isna(df[col].std()) else None
        }
    return stats
