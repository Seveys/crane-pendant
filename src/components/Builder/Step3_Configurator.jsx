import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Power, AlertOctagon, Disc, X, Plus, ChevronRight, Zap, Search, ChevronDown, ChevronUp
} from 'lucide-react';

const STYLES = {
    BLACK: { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-white' },
    RED: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white' },
    GREEN: { bg: 'bg-green-600', border: 'border-green-700', text: 'text-white' },
    YELLOW: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-black' },
    WHITE: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800' },
    BLUE: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' },
    NEUTRAL_HOLE: { bg: 'bg-zinc-700', border: 'border-zinc-800', text: 'text-white' }
};

// Parts allowed in the LARGE accessory hole (Updated with hyphens)
const LARGE_ACCESSORY_PARTS = [
    'XA-36088', 
    'XA-36081', 
    'XA-34316', 
    'XA34316', 
    'XA-34312', 
    'XA34312'
]; 

// Parts that should display as RED in the large accessory hole
const RED_PILOT_PARTS = ['XA-34316', 'XA-36081', 'XA-36088'];

export default function Step3_Configurator({ builder }) {
    const { 
        enclosure, slots, componentTypes, activeManufacturer, 
        updateSlot, setStep, extraSlots, updateExtraSlot 
    } = builder;

    // --- LOCAL STATE FOR UI ---
    const [searchTerm, setSearchTerm] = useState('');
    
    // All groups start collapsed
    const [expandedGroups, setExpandedGroups] = useState({
        'Emergency Stop': false,
        'Push Buttons': false,
        'Pilot Lights': false,
        'Switches': false,
        'Housing Accessories': false,
        'Other': false
    });

    const HOLE_SIZE = 64; 
    const GAP_SIZE = 24;  
    const SLOT_HEIGHT = HOLE_SIZE + GAP_SIZE;

    // Series 80 Check
    const isSeries80 = (
        ((activeManufacturer || '').toLowerCase().includes('conductix') || (enclosure?.series || '').includes('80')) &&
        (enclosure?.holes >= 6)
    );

    const isComplete = useMemo(() => {
        if (slots.length === 0) return false;
        return !slots.some(slot => slot.componentId === 'empty');
    }, [slots]);

    // --- HELPER: Get Component Style ---
    const getComponentStyle = (comp) => {
        if (!comp) return { ...STYLES.BLACK, class: 'bg-zinc-800 border-zinc-600 text-white', iconColor: 'text-white' }; 
        const colorName = (comp.color || '').toLowerCase();
        const category = (comp.category || '').toLowerCase();
        const type = (comp.type || '').toLowerCase();
        let style = { ...STYLES.BLACK, iconColor: 'text-white' };

        if (type === 'button') {
            if (category === 'estop' || category.includes('stop')) {
                style = { ...STYLES.RED, iconColor: 'text-red-700' };
            } else if (category.includes('on_off') || colorName.includes('green')) {
                style = { ...STYLES.GREEN, iconColor: 'text-white' };
            } else if (category.includes('on_off') || colorName.includes('red')) {
                style = { ...STYLES.RED, iconColor: 'text-white' };
            }
        } else if (type === 'light' || type === 'indicator') {
            if (colorName.includes('white')) style = { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', iconColor: 'text-gray-800' };
            else if (colorName.includes('blue')) style = { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', iconColor: 'text-white' };
            else if (colorName.includes('yellow')) style = { ...STYLES.YELLOW, iconColor: 'text-black' };
            else if (colorName.includes('red')) style = { ...STYLES.RED, iconColor: 'text-white' };
            else if (colorName.includes('green')) style = { ...STYLES.GREEN, iconColor: 'text-white' };
        }
        style.class = `${style.bg} ${style.border} ${style.text}`;
        return style;
    };

    // --- HELPER: Get Icon ---
    const getComponentIcon = (comp, relativeIndex = 0) => {
        if (!comp) return null;
        const name = (comp.name || '').toLowerCase();
        const category = (comp.category || '').toLowerCase();
        const holes = comp.holes || 1;
        const style = getComponentStyle(comp);

        if (holes > 1) {
            if (relativeIndex === 0) {
                if (category === 'on_off') return <Power size={24} />;
                if (name.includes('speed')) return <ArrowUp size={24} />;
                return <ArrowUp size={24} />;
            } else {
                if (category === 'on_off') return <Disc size={24} />;
                if (name.includes('speed')) return <ArrowDown size={24} />;
                return <ArrowDown size={24} />;
            }
        }

        if (comp.category === 'estop' || holes === 1) {
            if (comp.type === 'light') return <div className="w-4 h-4 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />;
            if (name.includes('up')) return <ArrowUp size={24} />;
            if (name.includes('down')) return <ArrowDown size={24} />;
            if (name.includes('start') || name.includes('on')) return <Power size={24} />;
            if (name.includes('stop') || name.includes('off')) return <Disc size={24} />;
            return <AlertOctagon size={24} fill="currentColor" className={style.iconColor}/>;
        }
        return null;
    };

    // --- HELPER: Get Multi-Hole Style ---
    const getMultiHoleStyle = (comp, relativeIndex) => {
        const category = (comp.category || '').toLowerCase();
        if (category === 'on_off') {
            if (relativeIndex === 0) return { ...STYLES.GREEN, class: `${STYLES.GREEN.bg} ${STYLES.GREEN.border} ${STYLES.GREEN.text}` };
            if (relativeIndex === 1) return { ...STYLES.RED, class: `${STYLES.RED.bg} ${STYLES.RED.border} ${STYLES.RED.text}` };
        }
        return getComponentStyle(comp);
    };

    // --- RENDER VISUAL SLOT ---
    const renderVisualSlot = (slot, slotIndex) => {
        let comp = null;
        let relativeIndex = 0;

        if (slot.componentId === 'linked') {
            const parentSlot = slots[slot.linkedTo];
            comp = componentTypes.find(c => c.id === parentSlot.componentId);
            relativeIndex = slotIndex - slot.linkedTo;
        } else if (slot.componentId !== 'empty') {
            comp = componentTypes.find(c => c.id === slot.componentId);
            relativeIndex = 0;
        }

        if (!comp) {
            return (
                <div key={slot.id} className="w-16 h-16 rounded-full bg-transparent shadow-inner flex items-center justify-center border-4 border-zinc-500/50">
                    <div className="w-12 h-12 rounded-full bg-black/10" />
                </div>
            );
        }

        const isEstop = comp.category === 'estop' || comp.id.includes('estop');
        const style = (comp.holes > 1) ? getMultiHoleStyle(comp, relativeIndex) : getComponentStyle(comp);
        const sizeClass = isEstop ? "w-20 h-20 -m-2 z-20" : "w-16 h-16 z-10";

        return (
            <div 
                key={slot.id} 
                className={`rounded-full shadow-lg flex items-center justify-center border-b-4 transition-transform hover:scale-105 ${style.class} ${sizeClass}`}
            >
                <div className="w-[85%] h-[85%] rounded-full border-2 border-white/10 flex items-center justify-center">
                    {getComponentIcon(comp, relativeIndex)}
                </div>
            </div>
        );
    };

    // --- RENDER EXTRA SLOT ---
    const renderExtraSlot = (type, sizePx) => {
        const compId = extraSlots[type];
        const comp = compId ? componentTypes.find(c => c.id === compId) : null;
        
        let centerColorClass = "bg-white/50"; 
        if (comp && RED_PILOT_PARTS.includes(comp.partNumber)) {
            centerColorClass = "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"; 
        } else if (comp && comp.partNumber === 'XA-34312') {
            centerColorClass = "bg-zinc-400"; 
        }

        return (
            <div 
                className="relative flex items-center justify-center bg-transparent rounded-full border-2 border-black/20 shadow-inner group cursor-pointer bg-yellow-500"
                style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
                onClick={() => {
                    if(!comp) alert(`Please select a compatible ${type} accessory from the list on the right.`);
                    else updateExtraSlot(type, null); 
                }}
            >
                {comp ? (
                    <div className={`w-full h-full rounded-full border flex items-center justify-center ${getComponentStyle(comp).class}`}>
                        <div className={`w-3 h-3 rounded-full shadow-sm ${centerColorClass}`} /> 
                    </div>
                ) : (
                    <div className="w-[60%] h-[60%] rounded-full bg-black/10" />
                )}
            </div>
        );
    };

    // --- DATA PREPARATION ---
    const availableComponents = useMemo(() => {
        return componentTypes.filter(c => 
            c.series === activeManufacturer || c.series === enclosure.series || c.series === 'global'
        );
    }, [componentTypes, activeManufacturer, enclosure]);

    // --- GROUPING LOGIC ---
    const groupedComponents = useMemo(() => {
        const groups = {
            'Emergency Stop': [],
            'Housing Accessories': [], // Explicit group for Series 80 parts
            'Push Buttons': [],
            'Pilot Lights': [],
            'Switches': [],
            'Other': []
        };

        const filtered = availableComponents.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filtered.forEach(c => {
            const cat = (c.category || '').toLowerCase();
            const type = (c.type || '').toLowerCase();
            const part = (c.partNumber || '');

            // Special Check for Housing Accessories
            if (LARGE_ACCESSORY_PARTS.includes(part)) {
                groups['Housing Accessories'].push(c);
            } else if (cat === 'estop' || cat.includes('emergency')) {
                groups['Emergency Stop'].push(c);
            } else if (type === 'light' || type === 'indicator') {
                groups['Pilot Lights'].push(c);
            } else if (type === 'selector' || type === 'switch') {
                groups['Switches'].push(c);
            } else if (type === 'button') {
                groups['Push Buttons'].push(c);
            } else {
                groups['Other'].push(c);
            }
        });

        // Hide Housing Accessories group if not Series 80
        if (!isSeries80) {
            delete groups['Housing Accessories'];
        }

        return groups;
    }, [availableComponents, searchTerm, isSeries80]);

    // Auto-expand groups when searching
    useEffect(() => {
        if (searchTerm) {
            setExpandedGroups({
                'Emergency Stop': true,
                'Housing Accessories': true,
                'Push Buttons': true,
                'Pilot Lights': true,
                'Switches': true,
                'Other': true
            });
        }
    }, [searchTerm]);

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    if (!enclosure) return <div>Please select an enclosure in Step 2.</div>;

    const housingMinHeight = (slots.length * SLOT_HEIGHT) + (isSeries80 ? SLOT_HEIGHT : 60);

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
            {/* LEFT: VISUAL PREVIEW */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-8 relative overflow-hidden min-h-[500px]">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative flex flex-col items-center">
                    <div className="w-8 h-6 bg-zinc-800 rounded-t mb-[-2px] z-0 mx-auto" />

                    <div 
                        className="bg-yellow-400 rounded-2xl shadow-2xl border-2 border-yellow-500 relative z-10 p-4 pt-12 flex flex-col gap-6 items-center" 
                        style={{ minWidth: '160px', minHeight: `${housingMinHeight}px` }}
                    >
                        {/* Series 80 Accessories */}
                        {isSeries80 && (
                            <div className="absolute top-4 left-4 flex flex-col gap-2 items-center">
                                {renderExtraSlot('small', 28)}
                                {renderExtraSlot('large', 38)} 
                            </div>
                        )}
                        
                        {/* Series 80 Spacer */}
                        {isSeries80 && (
                            <div style={{ height: `${SLOT_HEIGHT}px`, width: '100%', flexShrink: 0 }} />
                        )}
                        
                        {/* Standard Slots */}
                        {slots.map((slot, idx) => (
                            <div key={slot.id} className="relative group flex flex-col items-center justify-center"
                                style={{ height: `${HOLE_SIZE}px`, width: `${HOLE_SIZE}px` }}>
                                
                                {renderVisualSlot(slot, idx)}
                                
                                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                                        Hole #{idx + 1}: {slot.componentId === 'empty' ? 'Empty' : componentTypes.find(c => c.id === slot.componentId)?.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: COMPONENT SELECTOR */}
            <div className="w-full lg:w-96 flex flex-col bg-white border-l h-full max-h-[800px]">
                
                {/* 1. SEARCH BAR */}
                <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
                    <div>
                        <h3 className="font-bold text-slate-800">Select Components</h3>
                        <p className="text-xs text-slate-500">Click a component below to fill the next empty slot.</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search buttons, lights..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* 2. COMPONENT LIST */}
                <div className="overflow-y-auto flex-1 border-b bg-white">
                    {Object.entries(groupedComponents).map(([groupName, components]) => {
                        if (components.length === 0) return null;
                        const isExpanded = expandedGroups[groupName];

                        return (
                            <div key={groupName} className="border-b last:border-b-0">
                                {/* Accordion Header */}
                                <button 
                                    onClick={() => toggleGroup(groupName)}
                                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                >
                                    <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                        {groupName === 'Housing Accessories' && <Zap size={14} className="text-yellow-600"/>}
                                        {groupName} 
                                        <span className="text-xs font-normal text-slate-400">({components.length})</span>
                                    </span>
                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                                </button>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="p-2 space-y-2 bg-white">
                                        {components.map(comp => {
                                            // Determine if this is a housing accessory or a standard component
                                            const isHousingAcc = LARGE_ACCESSORY_PARTS.includes(comp.partNumber);

                                            return (
                                                <div key={comp.id} className="flex flex-col gap-2 p-3 border rounded-lg hover:border-blue-400 transition-colors bg-white shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getComponentStyle(comp).class}`}>
                                                                <div className="scale-50">{getComponentIcon(comp)}</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-slate-700">{comp.name} {comp.holes > 1 && <span className="text-xs text-blue-600">({comp.holes} Holes)</span>}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">{comp.partNumber}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* DYNAMIC ACTION BUTTON */}
                                                    {isHousingAcc ? (
                                                        <button 
                                                            onClick={() => {
                                                                updateExtraSlot('large', comp.id);
                                                                // AUTO-COLLAPSE ON SELECTION
                                                                setExpandedGroups(prev => ({ ...prev, 'Housing Accessories': false }));
                                                            }}
                                                            className="mt-2 w-full py-1.5 bg-yellow-100 hover:bg-yellow-600 hover:text-white text-yellow-800 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Plus size={12}/> Add to Housing (Top-Left)
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                const firstEmptyIndex = slots.findIndex(s => s.componentId === 'empty');
                                                                if (firstEmptyIndex !== -1) updateSlot(firstEmptyIndex, comp.id);
                                                                else alert("Enclosure is full! Clear a slot first.");
                                                            }}
                                                            className="mt-2 w-full py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Plus size={12}/> Add to Pendant
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* Empty State for Search */}
                    {Object.values(groupedComponents).every(arr => arr.length === 0) && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No components found matching "{searchTerm}"
                        </div>
                    )}
                </div>

                {/* 3. ACTIVE SLOTS / FOOTER */}
                <div className="p-4 border-t bg-slate-50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Current Configuration</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto mb-4">
                        {extraSlots.large && <div className="flex justify-between items-center text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                            <span className="font-mono text-slate-400">Acc L</span>
                            <span className="font-medium truncate flex-1 mx-2">{componentTypes.find(c => c.id === extraSlots.large)?.name}</span>
                            <button onClick={() => updateExtraSlot('large', null)} className="text-red-400 hover:text-red-600 p-1"><X size={12}/></button>
                        </div>}
                        
                        {slots.map((slot, idx) => {
                            if (slot.componentId === 'empty' || slot.componentId === 'linked') return null;
                            const activeComp = componentTypes.find(c => c.id === slot.componentId);
                            return (
                                <div key={slot.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                                    <span className="font-mono text-slate-400">#{idx + 1}</span>
                                    <span className="font-medium truncate flex-1 mx-2">{activeComp?.name}</span>
                                    <button onClick={() => updateSlot(slot.id, 'empty')} className="text-red-400 hover:text-red-600 p-1"><X size={12}/></button>
                                </div>
                            );
                        })}
                    </div>
                    {isComplete && (
                        <button onClick={() => setStep(4)} className="w-full mt-4 px-6 py-3 rounded-lg bg-green-600 text-white font-bold shadow-lg shadow-green-900/40 hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            Select Cable & Accessories <ChevronRight size={18}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}