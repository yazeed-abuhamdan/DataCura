import { GlassCard } from './GlassCard';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SuggestionCardProps {
    issueTitle: string;
    description: string;
    actionHtml?: React.ReactNode;
    riskAmount: 'Low' | 'Medium' | 'High';
    isEnabled: boolean;
    onToggle: () => void;
}

export function SuggestionCard({
    issueTitle,
    description,
    actionHtml,
    riskAmount,
    isEnabled,
    onToggle
}: SuggestionCardProps) {
    const riskColor = {
        Low: 'text-green-400 bg-green-400/10',
        Medium: 'text-yellow-400 bg-yellow-400/10',
        High: 'text-red-400 bg-red-400/10'
    }[riskAmount];

    return (
        <GlassCard className={cn("transition-all duration-300 border-l-4", isEnabled ? "border-l-blue-500" : "border-l-gray-600 opacity-60")}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-white">{issueTitle}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{description}</p>

                    <div className="flex items-center gap-3">
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-md", riskColor)}>
                            {riskAmount} Risk
                        </span>
                        {actionHtml && (
                            <div className="text-sm text-blue-300 py-1 px-3 bg-blue-500/10 rounded-md">
                                ↳ {actionHtml}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    className={cn(
                        "p-3 rounded-full transition-all",
                        isEnabled
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    )}
                >
                    {isEnabled ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
            </div>
        </GlassCard>
    );
}
