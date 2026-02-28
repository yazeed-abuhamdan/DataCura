def format_explanations(report: dict) -> list[str]:
    explanations = []
    
    if report.get("missing_values_fixed", 0) > 0:
        explanations.append(f"Fixed {report['missing_values_fixed']} missing values across the dataset.")
        
    if report.get("duplicates_removed", 0) > 0:
        explanations.append(f"Removed {report['duplicates_removed']} duplicate rows.")
        
    if report.get("outliers_handled", 0) > 0:
        explanations.append(f"Handled {report['outliers_handled']} outliers by capping them to acceptable bounds.")
        
    for action in report.get("actions", []):
        explanations.append(f"[{action['column']}] {action['action']}: {action['before']} -> {action['after']}. Reason: {action['reason']}")
        
    return explanations
