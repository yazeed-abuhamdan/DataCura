import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Database } from 'lucide-react';
import { DataContext } from './DataContext';
import { PageHeader } from './PageHeader';
import { SuggestionCard } from './SuggestionCard';

export function CleaningPage() {
    const { state, dispatch } = useContext(DataContext);
    const navigate = useNavigate();
    const [enabledActions, setEnabledActions] = useState<Record<string, boolean>>({});
    const [isCleaning, setIsCleaning] = useState(false);

    // Generate mock cleaning plan based on profiling
    useEffect(() => {
        if (state.columns.length > 0 && state.cleaningPlan.length === 0) {
            const plan = [];

            // 1. Duplicates (mocked 5% of rows)
            plan.push({
                id: 'dup_1',
                title: 'Duplicate Rows Detected',
                description: `Found approximately ${Math.floor(state.rawDataset.length * 0.05)} duplicate rows.`,
                actionHtml: 'Remove all exact duplicates',
                risk: 'Low',
                type: 'duplicates'
            });

            // 2. Missing values loop
            if (state.profiling.nullPercentages) {
                Object.entries(state.profiling.nullPercentages).forEach(([col, perc]) => {
                    if (perc > 0) {
                        const isNumeric = state.profiling.types?.[col] === 'Number';
                        plan.push({
                            id: `missing_${col}`,
                            title: `Missing Values in '${col}'`,
                            description: `${perc.toFixed(1)}% of rows are missing this value.`,
                            actionHtml: isNumeric ? 'Fill with Median' : 'Fill with Mode ("Unknown")',
                            risk: perc > 20 ? 'High' : 'Medium',
                            type: 'missing',
                            column: col,
                            isNumeric
                        });
                    }
                });
            }

            // 3. Outliers for numeric fields (mocked)
            if (state.profiling.types) {
                const numericCols = Object.entries(state.profiling.types)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .filter(([_, t]) => t === 'Number')
                    .map(([c]) => c);

                if (numericCols.length > 0) {
                    const col = numericCols[0]; // Just add one outlier suggestion for demo
                    plan.push({
                        id: `outlier_${col}`,
                        title: `Outliers Detected in '${col}'`,
                        description: `Values outside the Interquartile Range (IQR) detected.`,
                        actionHtml: 'Cap to IQR Bounds',
                        risk: 'Medium',
                        type: 'outliers',
                        column: col
                    });
                }
            }

            dispatch({ type: 'SET_CLEANING_PLAN', payload: plan });

            const initialEnabled: Record<string, boolean> = {};
            plan.forEach(p => {
                initialEnabled[p.id] = p.risk !== 'High'; // Auto-enable low/medium risk
            });
            setEnabledActions(initialEnabled);
        }
    }, [state, dispatch]);

    const handleApplyCleaning = async () => {
        setIsCleaning(true);
        try {
            // Call the real Python AI cleaning pipeline (AiModule/app.py).
            // The server runs clean_dataset() which executes:
            //   Step 0 — Isolation Forest  (AI multivariate anomaly detection)
            //   Step 1 — Duplicate removal
            //   Step 2 — KNN Imputation    (numeric) / Mode (categorical)
            //   Step 3 — IQR outlier capping
            const res = await fetch('http://localhost:8001/api/clean', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: state.rawDataset }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const result = await res.json();

            dispatch({ type: 'SET_CLEANED_DATA',    payload: result.cleaned_data });
            dispatch({ type: 'SET_EXPLAINABILITY',  payload: { report: result.report, summary: result.summary } });
            navigate('/results');
        } catch (err) {
            console.error('Cleaning failed:', err);
            alert('Could not connect to the cleaning server.\nMake sure AiModule/app.py is running:\n  cd AiModule && python app.py');
        } finally {
            setIsCleaning(false);
        }
    };

    if (state.rawDataset.length === 0) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center mt-20">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Dataset Found</h2>
                <button onClick={() => navigate('/upload')} className="px-6 py-2 bg-blue-600 text-white rounded-lg mt-4">Go to Upload</button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Cleaning Plan"
                description="Review the AI-generated suggestions to clean and normalize your data."
                action={
                    <button
                        onClick={handleApplyCleaning}
                        disabled={isCleaning}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
                    >
                        {isCleaning ? (
                            <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> Processing...</>
                        ) : (
                            <><Play className="w-5 h-5 fill-white" /> Apply Selected Actions</>
                        )}
                    </button>
                }
            />

            <div className="flex flex-col gap-4">
                {state.cleaningPlan.length === 0 ? (
                    <div className="text-gray-400 text-center py-12">No issues detected! Your dataset looks clean.</div>
                ) : (
                    state.cleaningPlan.map(plan => (
                        <SuggestionCard
                            key={plan.id}
                            issueTitle={plan.title}
                            description={plan.description}
                            actionHtml={plan.actionHtml}
                            riskAmount={plan.risk as any}
                            isEnabled={!!enabledActions[plan.id]}
                            onToggle={() => setEnabledActions(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
