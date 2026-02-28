import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, PieChart, Activity, Database } from 'lucide-react';
import { DataContext } from '../app/DataContext';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { GlassCard } from '../components/GlassCard';

export function ProfilingPage() {
    const { state, dispatch } = useContext(DataContext);
    const navigate = useNavigate();
    const [isComputing, setIsComputing] = useState(false);

    // Compute profiling locally if not exists
    useEffect(() => {
        if (state.rawDataset.length > 0 && !state.profiling.types) {
            setIsComputing(true);

            // Simulate heavy profiling computation in a setTimeout
            setTimeout(() => {
                const data = state.rawDataset;
                const columns = state.columns;
                const types: Record<string, string> = {};
                const nullPercentages: Record<string, number> = {};
                const uniqueCounts: Record<string, number> = {};

                columns.forEach(col => {
                    let nulls = 0;
                    let isNumeric = true;
                    const uniques = new Set();

                    data.forEach(row => {
                        const val = row[col];
                        uniques.add(val);
                        if (val === null || val === undefined || val === '') {
                            nulls++;
                        } else if (typeof val !== 'number') {
                            isNumeric = false;
                        }
                    });

                    types[col] = isNumeric ? 'Number' : 'String';
                    nullPercentages[col] = (nulls / data.length) * 100;
                    uniqueCounts[col] = uniques.size;
                });

                dispatch({
                    type: 'SET_PROFILING',
                    payload: { types, nullPercentages, uniqueCounts }
                });
                setIsComputing(false);
            }, 800);
        }
    }, [state.rawDataset, state.profiling.types, dispatch, state.columns]);

    if (state.rawDataset.length === 0) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center mt-20">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Dataset Found</h2>
                <p className="text-gray-400 mb-6">Please upload a dataset first to view its profile.</p>
                <button onClick={() => navigate('/upload')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go to Upload</button>
            </div>
        );
    }

    const { types, nullPercentages, uniqueCounts } = state.profiling;

    const nullChartData = Object.entries(nullPercentages || {}).map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }));
    const uniqueChartData = Object.entries(uniqueCounts || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Dataset Profiling"
                description="Auto-generated statistics and column metadata for your dataset."
                action={
                    <button
                        onClick={() => navigate('/cleaning')}
                        disabled={isComputing}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        Generate Cleaning Plan <ArrowRight className="w-4 h-4" />
                    </button>
                }
            />

            {isComputing ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-4 text-blue-400 font-medium">Profiling dataset...</span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title="Total Rows"
                            value={state.rawDataset.length.toLocaleString()}
                            icon={<Activity />}
                        />
                        <StatCard
                            title="Total Columns"
                            value={state.columns.length}
                            icon={<Database />}
                        />
                        <StatCard
                            title="Most Missing Column"
                            value={nullChartData.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
                            description={`${nullChartData.sort((a, b) => b.value - a.value)[0]?.value || 0}% missing`}
                            icon={<PieChart />}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <ChartCard title="Missing Values (%)" description="Percentage of null/empty values per column.">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={nullChartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#60a5fa' }}
                                    />
                                    <Bar dataKey="value" name="Null %" radius={[4, 4, 0, 0]}>
                                        {nullChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value > 20 ? '#ef4444' : '#60a5fa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Unique Value Counts" description="Total distinct values per column.">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={uniqueChartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#a78bfa' }}
                                    />
                                    <Bar dataKey="value" name="Unique Count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4">Column Metadata</h3>
                    <GlassCard className="overflow-hidden p-0">
                        <table className="w-full text-left text-gray-300">
                            <thead className="text-sm bg-black/40 border-b border-white/10 uppercase font-medium text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Column Name</th>
                                    <th className="px-6 py-4">Inferred Type</th>
                                    <th className="px-6 py-4">Null %</th>
                                    <th className="px-6 py-4">Unique Values</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {state.columns.map((col) => (
                                    <tr key={col} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{col}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${types?.[col] === 'Number' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {types?.[col] || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {nullPercentages?.[col]?.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {uniqueCounts?.[col]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </>
            )}
        </div>
    );
}
