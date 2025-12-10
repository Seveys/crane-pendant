import React, { useState, useMemo } from 'react';
import { 
    Box, ChevronDown, ChevronUp, ChevronRight, Link, Plus, Eye, Package 
} from 'lucide-react';

export default function Step3_Configurator({ builder }) {
    const { 
        slots, enclosure, componentTypes, activeManufacturer, 
        updateSlot, setStep 
    } = builder;

    const [expandedSlot, setExpandedSlot] = useState(null);
    const [hoveredComponent, setHoveredComponent] = useState(null);

    // Filter components available for this enclosure (Global + Manufacturer Specific)
    const availableComponents = useMemo(() => {
        return componentTypes.filter(c => 
            c.series === 'global' || 
            c.series === activeManufacturer || 
            c.series === enclosure?.series
        );
    }, [componentTypes, enclosure, activeManufacturer]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* LEFT: SLOT EDITOR */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                <h3 className="font-bold text-slate-700 mb-2">Configure {enclosure?.model}</h3>
                
                {slots.map((slot, index) => {
                    const selectedComp = componentTypes.find(c => c.id === slot.componentId);
                    const isExpanded = expandedSlot === index;
                    const isLinked = slot.componentId === 'linked';
                    
                    return (
                        <div key={index} className={`border rounded-lg mb-4 bg-white shadow-sm overflow-visible relative transition-all ${isLinked ? 'opacity-60 bg-slate-50 border-dashed' : ''}`}>
                            {/* Slot Header (Clickable) */}
                            <div 
                                className={`flex items-center p-4 ${isLinked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`} 
                                onClick={() => !isLinked && setExpandedSlot(isExpanded ? null : index)}
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 mr-4 shrink-0 shadow-inner text-sm">{index + 1}</div>
                                
                                <div className="flex-1">
                                    {isLinked ? (
                                        <div className="flex items-center gap-2 text-slate-400 italic text-sm"><Link size={16} /> Linked to Slot {slot.linkedTo + 1}</div>
                                    ) : (selectedComp && slot.componentId !== 'empty') ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border rounded flex items-center justify-center shrink-0 overflow-hidden p-1">
                                                {selectedComp.image ? <img src={selectedComp.image} className="w-full h-full object-contain"/> : <Box size={20} className="text-slate-300"/>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{selectedComp.name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{selectedComp.partNumber}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 font-medium flex items-center gap-2 text-sm"><Plus size={16} /> Select Component...</div>
                                    )}
                                </div>
                                {!isLinked && <div className="text-slate-300 ml-4">{isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>}
                            </div>

                            {/* Dropdown Selection Area */}
                            {isExpanded && !isLinked && (
                                <div className="border-t bg-slate-50 p-0 flex h-64">
                                    {/* List of Components */}
                                    <div className="w-3/5 border-r overflow-y-auto p-2">
                                        {availableComponents.filter(c => { 
                                            // Don't show multi-hole components if they won't fit at this index
                                            if (c.holes > 1 && index + c.holes > slots.length) return false; 
                                            return true; 
                                        }).map(comp => (
                                            <div 
                                                key={comp.id} 
                                                className={`p-2 rounded mb-1 cursor-pointer flex items-center gap-3 transition-colors ${slot.componentId === comp.id ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-white hover:shadow-sm'}`} 
                                                onClick={() => { updateSlot(index, comp.id); setExpandedSlot(null); }} 
                                                onMouseEnter={() => setHoveredComponent(comp)} 
                                                onMouseLeave={() => setHoveredComponent(null)}
                                            >
                                                <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">
                                                    {comp.image ? <img src={comp.image} className="w-6 h-6 object-contain"/> : <Box size={14} className="text-slate-300"/>}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-xs font-semibold truncate">{comp.name}</div>
                                                    <div className="text-[9px] text-slate-500 font-mono">{comp.partNumber}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview Panel */}
                                    <div className="flex-1 bg-white p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                        {(hoveredComponent || selectedComp) ? (
                                            <div className="animate-in fade-in zoom-in-95 duration-200 w-full h-full flex flex-col">
                                                <div className="flex-1 flex items-center justify-center p-2 mb-2">
                                                    {(hoveredComponent || selectedComp).image ? 
                                                        <img src={(hoveredComponent || selectedComp).image} className="max-w-full max-h-full object-contain" /> : 
                                                        <Package size={48} className="text-slate-200" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{(hoveredComponent || selectedComp).kcid}</div>
                                                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2">{(hoveredComponent || selectedComp).name}</h4>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-slate-300 flex flex-col items-center"><Eye size={32} className="mb-2" /><p className="text-xs">Preview</p></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <button 
                    onClick={() => setStep(4)} 
                    className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                    Calculate Cabling <ChevronRight size={20} />
                </button>
            </div>

            {/* RIGHT: VISUAL PREVIEW */}
            <div className="lg:w-1/3 bg-slate-100 rounded-xl p-6 flex flex-col items-center border border-slate-200 min-h-[500px]">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-6 text-sm">Visual Preview</h4>
                <div className={`relative ${activeManufacturer === 'duct-o-wire' || activeManufacturer === 'demag' ? 'bg-yellow-400' : 'bg-orange-500'} w-32 rounded-3xl shadow-2xl border-4 border-slate-800 flex flex-col items-center py-6 gap-4`}>
                    {/* Cable gland mockup at top */}
                    <div className="absolute -top-6 w-8 h-6 bg-slate-700 rounded-sm"></div>
                    <div className="absolute -top-12 w-2 h-8 bg-black"></div>
                    
                    {slots.map((slot, idx) => {
                        if (slot.componentId === 'linked') return null; 
                        const comp = componentTypes.find(c => c.id === slot.componentId); 
                        if (!comp) return null;
                        
                        return (
                            <div key={idx} className="relative group flex flex-col items-center">
                                {/* Multi-hole outline indicator */}
                                {comp.holes > 1 && <div className="absolute inset-0 border-2 border-slate-400/30 rounded-lg -m-2 pointer-events-none"></div>}
                                
                                {comp.image ? (
                                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner overflow-hidden bg-white">
                                        <img src={comp.image} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner ${comp.color === 'bg-black' ? 'bg-slate-900' : comp.color}`}>
                                        {comp.id === 'estop' && <div className="w-12 h-12 rounded-full bg-red-600 border-2 border-red-800 shadow-lg"></div>}
                                        {comp.holes > 1 && <div className="flex flex-col gap-1"><div className="w-8 h-3 bg-white/20 rounded-sm"></div><div className="w-8 h-3 bg-white/20 rounded-sm"></div></div>}
                                    </div>
                                )}
                                
                                {/* Spacing for multi-hole */}
                                {comp.holes > 1 && <div className="h-4 w-8 bg-slate-800 my-1"></div>}
                                
                                {/* Second Hole Render for 2-hole components */}
                                {comp.holes > 1 && (
                                    <div className={`w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner ${comp.image ? 'bg-white' : (comp.color === 'bg-black' ? 'bg-slate-900' : comp.color)}`}>
                                        {comp.image ? (<img src={comp.image} className="w-full h-full object-cover opacity-50 grayscale" />) : (<div className="w-8 h-3 bg-white/20 rounded-sm"></div>)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}