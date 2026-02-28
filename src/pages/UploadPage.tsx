import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { UploadCloud, FileType, CheckCircle } from 'lucide-react';
import { DataContext } from '../app/DataContext';
import { PageHeader } from '../components/PageHeader';
import { GlassCard } from '../components/GlassCard';
import { DataTable } from '../components/DataTable';
import { motion } from 'framer-motion';

export function UploadPage() {
    const { state, dispatch } = useContext(DataContext);
    const navigate = useNavigate();
    const [isHovering, setIsHovering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Only CSV files are supported currently.');
            return;
        }
        setError(null);

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError(`Error parsing CSV: ${results.errors[0].message}`);
                    return;
                }

                const data = results.data as any[];
                const columns = results.meta.fields || [];

                dispatch({ type: 'SET_RAW_DATA', payload: { data, columns } });
            }
        });
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const hasData = state.rawDataset.length > 0;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Upload Dataset"
                description="Drop your raw CSV file here to begin the data curation process."
                action={
                    hasData && (
                        <button
                            onClick={() => navigate('/profiling')}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            Go to Profiling <CheckCircle className="w-4 h-4" />
                        </button>
                    )
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="col-span-1 border-dashed border-2 border-white/20 hover:border-blue-500/50 transition-colors">
                    <div
                        className={`flex flex-col items-center justify-center p-12 text-center h-full ${isHovering ? 'opacity-50' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                        onDragLeave={() => setIsHovering(false)}
                        onDrop={onDrop}
                    >
                        <UploadCloud className="w-16 h-16 text-blue-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop your CSV</h3>
                        <p className="text-gray-400 text-sm mb-6">or click to browse from your computer</p>

                        <label className="cursor-pointer px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 font-medium">
                            Browse Files
                            <input type="file" className="hidden" accept=".csv" onChange={onFileInput} />
                        </label>

                        {error && (
                            <p className="mt-4 text-red-400 text-sm bg-red-400/10 p-2 rounded-md">{error}</p>
                        )}
                    </div>
                </GlassCard>

                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {hasData ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <GlassCard className="mb-6">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                        <FileType className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Dataset Loaded</h3>
                                        <p className="text-gray-400 text-sm">
                                            {state.rawDataset.length.toLocaleString()} rows • {state.columns.length} columns
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>

                            <h3 className="text-lg font-medium text-white mb-4">Data Preview</h3>
                            <DataTable columns={state.columns} data={state.rawDataset} maxRows={10} />
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-black/20 text-gray-500 p-12 text-center">
                            Upload a dataset to see the preview and schema information here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
