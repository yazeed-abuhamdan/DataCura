import { useContext } from 'react';
import Papa from 'papaparse';
import { Database, DownloadCloud, FileJson, FileSpreadsheet } from 'lucide-react';
import { DataContext } from '../app/DataContext';
import { PageHeader } from '../components/PageHeader';
import { GlassCard } from '../components/GlassCard';

export function ExportPage() {
    const { state } = useContext(DataContext);

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const csv = Papa.unparse(state.cleanedDataset);
        downloadFile(csv, 'datacura_cleaned.csv', 'text/csv;charset=utf-8;');
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(state.cleanedDataset, null, 2);
        downloadFile(json, 'datacura_cleaned.json', 'application/json');
    };

    const handleExportExplainability = () => {
        const json = JSON.stringify(state.explainability, null, 2);
        downloadFile(json, 'datacura_report.json', 'application/json');
    };

    if (state.cleanedDataset.length === 0) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center mt-20">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Nothing to Export</h2>
                <p className="text-gray-400">Please complete the cleaning process first.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Export Data"
                description="Download your fully cleaned dataset and the automated explainability report."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
                <GlassCard className="text-center hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={handleExportCSV}>
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Export as CSV</h3>
                    <p className="text-gray-400 text-sm mb-6">Standard tabular format, compatible with Excel, Pandas, and any database.</p>
                    <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors w-full flex items-center justify-center gap-2">
                        <DownloadCloud className="w-4 h-4" /> Download CSV
                    </button>
                </GlassCard>

                <GlassCard className="text-center hover:border-purple-500/50 transition-colors group cursor-pointer" onClick={handleExportJSON}>
                    <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <FileJson className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Export as JSON</h3>
                    <p className="text-gray-400 text-sm mb-6">Array of objects, perfect for APIs, NoSQL databases, and web applications.</p>
                    <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors w-full flex items-center justify-center gap-2">
                        <DownloadCloud className="w-4 h-4" /> Download JSON
                    </button>
                </GlassCard>

                <div className="col-span-1 md:col-span-2 text-center mt-8">
                    <button
                        onClick={handleExportExplainability}
                        className="text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4"
                    >
                        Download Explainability Report Background (JSON)
                    </button>
                </div>
            </div>
        </div>
    );
}
