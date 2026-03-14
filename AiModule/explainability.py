def format_explanations(report: dict) -> list[str]:
    explanations = []

    # ── AI Anomaly Detection summary (Isolation Forest) ──────────────────
    # These keys are populated by the AI step in data_cleaner.clean_dataset().
    # The block is skipped silently when the keys are absent (backward compat).
    ai_detected = report.get("ai_anomalies_detected", 0)
    ai_pct = report.get("ai_anomalies_pct", 0.0)
    ai_handling = report.get("ai_anomaly_handling", "none")
    ai_contamination = report.get("ai_contamination_used", 0.05)

    if ai_detected > 0:
        explanations.append(
            f"[AI] Isolation Forest detected {ai_detected} anomalous row(s) "
            f"({ai_pct}% of dataset) — adaptive contamination rate: {ai_contamination}."
        )
        explanations.append(
            f"[AI] Anomaly handling: {ai_handling}."
        )
    else:
        explanations.append(
            f"[AI] Isolation Forest found no multivariate anomalies "
            f"(adaptive contamination rate used: {ai_contamination})."
        )
    # ─────────────────────────────────────────────────────────────────────

    if report.get("missing_values_fixed", 0) > 0:
        explanations.append(f"Fixed {report['missing_values_fixed']} missing values across the dataset.")
        
    if report.get("duplicates_removed", 0) > 0:
        explanations.append(f"Removed {report['duplicates_removed']} duplicate rows.")
        
    if report.get("outliers_handled", 0) > 0:
        explanations.append(f"Handled {report['outliers_handled']} outliers by capping them to acceptable bounds.")
        
    for action in report.get("actions", []):
        explanations.append(f"[{action['column']}] {action['action']}: {action['before']} -> {action['after']}. Reason: {action['reason']}")
        
    return explanations
