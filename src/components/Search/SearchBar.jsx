import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';

export default function SearchBar({ 
    searchQuery, setSearchQuery, 
    onSearch, onSelectResult, 
    allSearchableItems 
}) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef(null);

    // --- SEARCH FILTER LOGIC ---
    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerQ = searchQuery.toLowerCase();
        return allSearchableItems.filter(item => 
            item.match.toLowerCase().includes(lowerQ)
        );
    }, [searchQuery, allSearchableItems]);

    // --- CLICK OUTSIDE LISTENER ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchContainerRef]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearch(searchQuery);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="flex-1 max-w-md relative hidden md:block" ref={searchContainerRef}>
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            
            <input 
                type="text" 
                placeholder="Search KCID, Part #, or Name..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500 text-white"
                value={searchQuery}
                onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setShowSuggestions(true); 
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
            />

            {/* AUTOFILL SUGGESTIONS */}
            {showSuggestions && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                        <>
                            {searchResults.slice(0, 6).map((item, idx) => (
                                <button
                                    key={idx}
                                    className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 border-b last:border-0 transition-colors"
                                    onClick={() => {
                                        onSelectResult(item);
                                        setShowSuggestions(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0 border">
                                        {item.data.image ? <img src={item.data.image} className="w-8 h-8 object-contain" alt=""/> : <Search size={16} className="text-slate-400"/>}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-bold text-slate-800 truncate">{item.data.name || item.data.model}</div>
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">{item.type}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{item.data.kcid || item.data.partNumber || item.data.part}</div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300"/>
                                </button>
                            ))}
                            
                            {searchResults.length > 6 && (
                                <button 
                                    onClick={() => { onSearch(searchQuery); setShowSuggestions(false); }}
                                    className="w-full p-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 bg-slate-50 sticky bottom-0 border-t"
                                >
                                    View all {searchResults.length} results
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="p-4 text-center text-slate-400 text-sm">No matching parts found</div>
                    )}
                </div>
            )}
        </div>
    );
}