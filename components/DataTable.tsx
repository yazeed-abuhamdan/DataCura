interface DataTableProps {
    columns: string[];
    data: any[];
    maxRows?: number;
}

export function DataTable({ columns, data, maxRows = 20 }: DataTableProps) {
    const displayData = data.slice(0, maxRows);

    if (!columns.length || !data.length) {
        return <div className="text-center text-gray-500 py-8">No data available</div>;
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-white/10">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className="px-6 py-3 font-medium truncate max-w-[200px]" title={col}>
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 truncate max-w-[200px]" title={String(row[col])}>
                                    {row[col] === null || row[col] === undefined || row[col] === '' ? (
                                        <span className="text-gray-600 italic">null</span>
                                    ) : (
                                        String(row[col])
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length > maxRows && (
                <div className="px-6 py-3 bg-black/40 text-xs text-gray-400 text-center border-t border-white/10">
                    Showing {maxRows} of {data.length} rows
                </div>
            )}
        </div>
    );
}
