import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    description?: string;
    className?: string;
}

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
    return (
        <GlassCard className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">{title}</h3>
                {icon && <div className="text-blue-400">{icon}</div>}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </GlassCard>
    );
}
