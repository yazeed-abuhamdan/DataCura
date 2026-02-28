import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

interface ChartCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
    return (
        <GlassCard className={className}>
            <div className="mb-4">
                <h3 className="text-lg font-medium text-white">{title}</h3>
                {description && <p className="text-sm text-gray-400">{description}</p>}
            </div>
            <div className="w-full h-[300px]">
                {children}
            </div>
        </GlassCard>
    );
}
