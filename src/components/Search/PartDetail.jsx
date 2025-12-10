import React from 'react';
import { ChevronLeft, Package, FileText, Download } from 'lucide-react';

export default function PartDetail({ 
    selectedPartDetail, 
    onBack 
}) {
    if (!selectedPartDetail) return null;

    const part = selectedPartDetail.data;
    const type = selectedPartDetail.type;

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header / Back Button */}
            <div className="bg-white px-6 py-4 border-b">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold text-sm transition-colors"
                >
                    <ChevronLeft size={18}/> Back to Search Results
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    
                    {/* Image Section */}
                    <div className="lg:w-1/3 flex items-center justify-center bg-slate-100 rounded-xl p-8 min-h-[300px]">
                        {part.image ? (
                            <img src={part.image} className="max-h-64 max-w-full object-contain" alt={part.name}/>
                        ) : (
                            <Package size={128} className="text-slate-300"/>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{type}</span>
                            <span className="text-slate-400 text-sm font-mono">{part.kcid || 'No KCID'}</span>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{part.name || part.model || part.type}</h1>
                        <p className="text-slate-500 mb-6 text-lg">{part.desc || part.description || "No description available."}</p>
                        
                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {part.partNumber && (
                                <div className="bg-slate-50 p-3 rounded border">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Part Number</div>
                                    <div className="font-mono font-semibold text-slate-700">{part.partNumber}</div>
                                </div>
                            )}
                            {part.wires !== undefined && (
                                <div className="bg-slate-50 p-3 rounded border">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wires</div>
                                    <div className="font-mono font-semibold text-slate-700">{part.wires}</div>
                                </div>
                            )}
                            {part.holes !== undefined && (
                                <div className="bg-slate-50 p-3 rounded border">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Holes</div>
                                    <div className="font-mono font-semibold text-slate-700">{part.holes}</div>
                                </div>
                            )}
                            {part.conductors !== undefined && (
                                <div className="bg-slate-50 p-3 rounded border">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Conductors</div>
                                    <div className="font-mono font-semibold text-slate-700">{part.conductors}</div>
                                </div>
                            )}
                        </div>

                        {/* Documentation Section */}
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-slate-400"/> Documentation
                            </h3>
                            <div className="space-y-2">
                                {part.docs && part.docs.length > 0 ? (
                                    part.docs.map((doc, i) => (
                                        <a 
                                            key={i} 
                                            href={doc.data} 
                                            download={doc.name} 
                                            className="flex items-center justify-between p-3 border rounded hover:bg-slate-50 group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-red-100 p-2 rounded text-red-600">
                                                    <FileText size={20}/>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-700">{doc.name}</div>
                                                    <div className="text-xs text-slate-400">{doc.type} • {doc.size || 'Unknown Size'}</div>
                                                </div>
                                            </div>
                                            <Download size={16} className="text-slate-300 group-hover:text-blue-600"/>
                                        </a>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded text-center">No documentation uploaded for this part.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}