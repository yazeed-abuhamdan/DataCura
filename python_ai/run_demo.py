import json
import os
from data_cleaner import load_dataset, profile_dataset, clean_dataset
from explainability import format_explanations

def main():
    sample_path = os.path.join(os.path.dirname(__file__), "samples", "sample.csv")
    
    print(f"Loading dataset from {sample_path}...")
    df = load_dataset(sample_path)
    
    print("\n--- Initial Profiling ---")
    profile = profile_dataset(df)
    print(json.dumps(profile, indent=2, default=str))
    
    print("\n--- Cleaning Dataset ---")
    cleaned_df, report = clean_dataset(df)
    
    cleaned_path = os.path.join(os.path.dirname(__file__), "samples", "cleaned.csv")
    cleaned_df.to_csv(cleaned_path, index=False)
    print(f"Cleaned dataset saved to {cleaned_path}")
    
    print("\n--- Explainability Report ---")
    print(json.dumps(report, indent=2))
    
    print("\n--- Human Readable Explanations ---")
    exps = format_explanations(report)
    for exp in exps:
        print(f"- {exp}")

if __name__ == "__main__":
    main()
