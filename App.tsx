import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Database, UploadCloud, BarChart2, Zap, FileOutput, ShieldCheck } from 'lucide-react';
import { DataProvider } from './app/DataContext';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { ProfilingPage } from './pages/ProfilingPage';
import { CleaningPage } from './pages/CleaningPage';
import { ResultsPage } from './pages/ResultsPage';
import { ExportPage } from './pages/ExportPage';
import { cn } from './lib/utils';

function NavLink({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
        >
            <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "")} />
            {label}
        </Link>
    );
}

function InnerApp() {
    return (
        <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-200 font-sans selection:bg-blue-500/30">
            <header className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b border-white/5">
                <Link to="/" className="text-xl font-bold flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Database className="w-4 h-4 text-white" />
                    </div>
                    Data Cura
                </Link>
                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/upload" icon={UploadCloud} label="Upload" />
                    <NavLink to="/profiling" icon={BarChart2} label="Profiling" />
                    <NavLink to="/cleaning" icon={Zap} label="Cleaning" />
                    <NavLink to="/results" icon={ShieldCheck} label="Results" />
                    <NavLink to="/export" icon={FileOutput} label="Export" />
                </nav>
            </header>

            <main className="flex-1 overflow-auto relative">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-500/5 blur-[150px] pointer-events-none" />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/profiling" element={<ProfilingPage />} />
                    <Route path="/cleaning" element={<CleaningPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/export" element={<ExportPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <DataProvider>
            <Router>
                <InnerApp />
            </Router>
        </DataProvider>
    );
}
