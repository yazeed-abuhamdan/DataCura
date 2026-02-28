import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, UploadCloud, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export function LandingPage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full flex flex-col items-center pt-20 pb-16 px-6">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center max-w-4xl mb-24 relative"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Beta Platform Live
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400 mb-8 leading-tight">
                    Clean Your Data in Seconds
                </h1>

                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    The AI-powered automated data cleaning tool. Drop your messy datasets, automatically detect issues, and generate pristine data ready for analysis.
                </p>

                <Link to="/upload">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full text-lg shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 mx-auto"
                    >
                        Upload Dataset
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </Link>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full"
            >
                <GlassCard variants={item} className="text-center hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Smart Profiling</h3>
                    <p className="text-gray-400 text-sm">Instantly detect null values, types, and distributions across your entire dataset.</p>
                </GlassCard>

                <GlassCard variants={item} className="text-center hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Automatic Cleaning</h3>
                    <p className="text-gray-400 text-sm">Auto-generate and apply a smart cleaning plan for missing data, outliers, and duplicates.</p>
                </GlassCard>

                <GlassCard variants={item} className="text-center hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Explainable AI</h3>
                    <p className="text-gray-400 text-sm">Every action is documented in human-readable plain english so you understand the changes.</p>
                </GlassCard>

                <GlassCard variants={item} className="text-center hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Export Anywhere</h3>
                    <p className="text-gray-400 text-sm">Download your cleaned dataset instantly in CSV or JSON ready for production use.</p>
                </GlassCard>
            </motion.div>
        </div>
    );
}
