import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                {description && <p className="text-gray-400">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
