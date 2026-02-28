import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, AlertCircle, Sparkles } from 'lucide-react';
import { DataContext } from '../app/DataContext';
import { PageHeader } from '../components/PageHeader';
import { GlassCard } from '../components/GlassCard';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';

export function ResultsPage() {
    const { state } = useContext(DataContext);
    const navigate = useNavigate();

    if (state.cleanedDataset.length === 0) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center mt-20">
                <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Cleaned Data</h2>
                <p className="text-gray-400 mb-6">You need to run the cleaning process first.</p>
                <button onClick={() => navigate('/cleaning')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go to Cleaning</button>
            </div>
        );
    }

    const { report, summary } = state.explainability;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Cleaning Results"
                description="Review your cleaned dataset and understand exactly what the AI changed."
                action={
                    <button
                        onClick={() => navigate('/export')}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        Export Data <Download className="w-4 h-4" />
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Missing Fixed" value={report?.missing_values_fixed || 0} />
                <StatCard title="Duplicates Removed" value={report?.duplicates_removed || 0} />
                <StatCard title="Outliers Handled" value={report?.outliers_handled || 0} />
                <StatCard title="Final Rows" value={state.cleanedDataset.length.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" /> Cleaned Data Preview
                    </h3>
                    <DataTable columns={state.columns} data={state.cleanedDataset} maxRows={15} />
                </div>

                <div className="col-span-1 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-400" /> Explainability Report
                    </h3>
                    <GlassCard className="h-[calc(100%-40px)] flex flex-col">
                        <div className="space-y-4 mb-6">
                            {summary?.map((s, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                    <p className="text-gray-300">{s}</p>
                                </div>
                            ))}
                        </div>

                        <h4 className="font-semibold text-white mb-3 text-sm border-b border-white/10 pb-2">Technical Action Log</h4>
                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                            {report?.actions?.map((act: any, i: number) => (
                                <div key={i} className="bg-black/20 p-3 rounded-lg border border-white/5 text-xs">
                                    <div className="font-semibold text-blue-300 mb-1">[{act.column}] {act.action}</div>
                                    <div className="text-gray-400">{act.before} → <span className="text-green-400">{act.after}</span></div>
                                    <div className="text-gray-500 mt-1 italic">Reason: {act.reason}</div>
                                </div>
                            ))}
                            {(!report?.actions || report.actions.length === 0) && (
                                <div className="text-gray-500 text-sm italic">No actions recorded.</div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
