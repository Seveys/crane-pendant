import React, { useMemo } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';

export default function SearchResults({ 
    searchQuery, 
    allSearchableItems, 
    onClose, 
    onSelectResult 
}) {
    // Re-run search here for the full list logic
    const results = useMemo(() => {
        if (!searchQuery) return [];
        const lowerQ = searchQuery.toLowerCase();
        return allSearchableItems.filter(item => 
            item.match.toLowerCase().includes(lowerQ)
        );
    }, [searchQuery, allSearchableItems]);

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-white px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Search className="text-blue-600" size={20}/>
                    Search Results
                </h2>
                <button 
                    onClick={onClose} 
                    className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
                >
                    <X size={16}/> Close Search
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Search size={48} className="mb-4 text-slate-200"/>
                        <p>No results found for "<span className="font-bold text-slate-500">{searchQuery}</span>"</p>
                        <button onClick={onClose} className="mt-4 text-blue-600 hover:underline">Return to Builder</button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden divide-y">
                        {results.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => onSelectResult(item)} 
                                className="p-4 flex items-center gap-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border">
                                    {item.data.image ? 
                                        <img src={item.data.image} className="w-10 h-10 object-contain" alt=""/> : 
                                        <Search size={20} className="text-slate-300"/>
                                    }
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{item.type}</span>
                                        <span className="text-xs font-mono text-slate-400">{item.data.kcid}</span>
                                    </div>
                                    <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                        {item.data.name || item.data.model || item.data.type}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.data.desc || item.data.description || item.data.partNumber || item.data.part || ''}
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500"/>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}