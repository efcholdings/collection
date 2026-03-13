'use client';

export default function TokenAnalyticsTable({ rawData }: { rawData: any[] }) {
    if (!rawData || rawData.length === 0) {
        return (
            <div className="bg-white border border-neutral-100 p-8 rounded flex items-center justify-center">
                <p className="text-sm font-light text-neutral-400">No token metrics have been recorded yet.</p>
            </div>
        );
    }

    const grandTotal = rawData.reduce((acc, u) => acc + u.totalTokens, 0);
    const estimatedCost = (grandTotal / 1000000) * 0.15; // Rough estimate for Gemini Flash $0.15 / 1M tokens

    return (
        <div className="w-full">
             <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-light" style={{ fontFamily: 'var(--font-playfair), serif' }}>AI Token Analytics</h2>
                    <p className="font-sans text-xs text-neutral-500 mt-1">
                        Institutional footprint of Semantic Vector & LLM consumption.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Total System Burn</p>
                    <p className="text-xl font-light text-indigo-600">⚡ {grandTotal.toLocaleString()} <span className="text-xs text-neutral-400 font-sans tracking-wide">~${estimatedCost.toFixed(4)} USD</span></p>
                </div>
             </div>

             <div className="bg-white border border-neutral-100 relative overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                            <th className="py-4 px-6 text-[9px] uppercase tracking-[0.2em] font-medium text-neutral-400 w-1/4">User</th>
                            <th className="py-4 px-6 text-[9px] uppercase tracking-[0.2em] font-medium text-neutral-400">Queries Executed</th>
                            <th className="py-4 px-6 text-[9px] uppercase tracking-[0.2em] font-medium text-indigo-400">Burn (This Month)</th>
                            <th className="py-4 px-6 text-[9px] uppercase tracking-[0.2em] font-medium text-indigo-400">Burn (All Time)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rawData.map((user, idx) => (
                            <tr key={user.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <p className="text-xs font-medium text-neutral-900">{user.name}</p>
                                    <p className="text-[9px] text-neutral-400 tracking-wide mt-0.5">{user.email}</p>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="text-xs text-neutral-500 font-light">{user.transactionCount} Events</span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="text-xs font-semibold text-indigo-600">{user.thisMonthTokens.toLocaleString()}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="text-xs text-neutral-700">{user.totalTokens.toLocaleString()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
}
