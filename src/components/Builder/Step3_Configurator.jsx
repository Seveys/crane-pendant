import React, { useMemo } from 'react';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Power, AlertOctagon, Disc, X, Plus, ChevronRight
} from 'lucide-react';

export default function Step3_Configurator({ builder }) {
    const { 
        enclosure, slots, componentTypes, activeManufacturer, 
        updateSlot, setStep
    } = builder;

    // --- CONSTANTS ---
    const HOLE_SIZE = 64; // w-16 or h-16 (64px)
    const GAP_SIZE = 24;  // equivalent to mb-6 (1.5rem) (24px)
    const SLOT_HEIGHT = HOLE_SIZE + GAP_SIZE; // Total vertical space per slot (88px)

    // --- LOGIC: Check if the configuration is complete ---
    const isComplete = useMemo(() => {
        if (slots.length === 0) return false;
        return !slots.some(slot => slot.componentId === 'empty');
    }, [slots]);

    // --- HELPER: Get Color Class for BUTTON/HOUSING ---
    const getComponentColor = (comp) => {
        if (!comp) return { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-white' }; 
        
        const colorName = (comp.color || '').toLowerCase();
        const category = (comp.category || '').toLowerCase();
        const type = (comp.type || '').toLowerCase();
        
        let bg = 'bg-zinc-800';
        let border = 'border-zinc-600';
        let text = 'text-white';

        // 1. Safety/Control Colors (Red/Green/Yellow for E-Stop, On/Off)
        if (type === 'button' && (category === 'on_off' || category === 'estop')) {
            if (colorName.includes('green')) { bg = 'bg-green-600'; border = 'border-green-700'; }
            else if (colorName.includes('red')) { bg = 'bg-red-600'; border = 'border-red-700'; }
            else if (colorName.includes('yellow')) { bg = 'bg-yellow-400'; border = 'border-yellow-500'; text = 'text-black'; }
        }
        
        // 2. Default for Directional Buttons (Black/Neutral)
        else if (type === 'button') {
            bg = 'bg-zinc-800'; border = 'border-zinc-600';
        }

        // 3. Lights and other components
        else {
            if (colorName.includes('white')) { bg = 'bg-gray-100'; border = 'border-gray-300'; text = 'text-gray-800'; }
            else if (colorName.includes('blue')) { bg = 'bg-blue-600'; border = 'border-blue-700'; }
        }

        // For multi-hole components, the visual housing is usually grey/black/zinc
        if ((comp.holes || 1) > 1) {
             bg = 'bg-zinc-700';
             border = 'border-zinc-800';
             text = 'text-white';
        }

        return { bg, border, text, class: `${bg} ${border} ${text}` };
    };

    // --- HELPER: Get Icon (Unchanged) ---
    const getComponentIcon = (comp) => {
        if (!comp) return null;
        const name = (comp.name || '').toLowerCase();
        const type = (comp.type || '').toLowerCase();
        const cat = (comp.category || '').toLowerCase();

        if (cat.includes('estop') || name.includes('e-stop')) return <AlertOctagon size={24} fill="currentColor" className="text-red-700"/>;
        if (name.includes('up')) return <ArrowUp size={24} />;
        if (name.includes('down')) return <ArrowDown size={24} />;
        if (name.includes('left')) return <ArrowLeft size={24} />;
        if (name.includes('right')) return <ArrowRight size={24} />;
        if (name.includes('start') || name.includes('on')) return <Power size={24} />;
        if (name.includes('stop') || name.includes('off')) return <Disc size={24} />;
        if (type === 'light') return <div className="w-4 h-4 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />;
        
        return null;
    };

    // --- RENDER VISUAL SLOT/COMPONENT ---
    const renderVisualSlot = (slot, idx) => {
        const comp = componentTypes.find(c => c.id === slot.componentId);
        
        // 1. Linked Slot (BLANK FILLER)
        if (slot.componentId === 'linked') {
            // Find the component that occupies this linked slot
            const anchorSlot = slots[slot.linkedTo];
            const anchorComp = componentTypes.find(c => c.id === anchorSlot.componentId);
            const anchorColors = getComponentColor(anchorComp);
            
            // Render this linked slot using the color of the multi-hole component's housing
            return (
                <div 
                    key={slot.id} 
                    className={`w-16 h-16 rounded-full shadow-inner flex items-center justify-center border-4 ${anchorColors.border} ${anchorColors.bg}`}
                />
            );
        }
        
        // 2. Empty Slot
        if (!comp || slot.componentId === 'empty') {
            return (
                <div 
                    key={slot.id} 
                    className="w-16 h-16 rounded-full bg-transparent shadow-inner flex items-center justify-center border-4 border-zinc-500/50"
                >
                    <div className="w-12 h-12 rounded-full bg-black/10" /> 
                </div>
            );
        }

        // 3. Anchor Slot (The Button)
        const colors = getComponentColor(comp);
        const isEstop = comp.category === 'estop' || comp.id.includes('estop');
        const sizeClass = isEstop ? "w-20 h-20 -m-2" : "w-16 h-16";

        return (
            <div 
                key={slot.id}
                className={`rounded-full shadow-lg flex items-center justify-center border-b-4 ${colors.class} ${sizeClass} transition-transform hover:scale-105`}
            >
                <div className="w-[85%] h-[85%] rounded-full border-2 border-white/10 flex items-center justify-center">
                    {getComponentIcon(comp)}
                </div>
            </div>
        );
    };
    
    if (!enclosure) return <div>Please select an enclosure in Step 2.</div>;

    const availableComponents = componentTypes.filter(c => 
        c.series === activeManufacturer || 
        c.series === enclosure.series || 
        c.series === 'global'
    );

    // --- MAIN RENDER LOGIC ---
    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
            
            {/* LEFT: VISUAL PREVIEW */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-8 relative overflow-hidden min-h-[500px]">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                />

                {/* THE PENDANT */}
                <div className="relative flex flex-col items-center">
                    {/* Cable Gland (Top) */}
                    <div className="w-8 h-6 bg-zinc-800 rounded-t mb-[-2px] z-0 mx-auto" />

                    {/* Enclosure Body */}
                    <div 
                        className="bg-yellow-400 rounded-2xl shadow-2xl border-2 border-yellow-500 relative z-10 p-4 flex flex-col gap-6 items-center" // Restored gap-6 for simplicity
                        style={{ minWidth: '140px', minHeight: `${slots.length * SLOT_HEIGHT + 40}px` }} 
                    >
                        {/* Render Slots */}
                        {slots.map((slot, idx) => (
                            <div 
                                key={slot.id} 
                                className="relative group flex flex-col items-center justify-center"
                            >
                                {renderVisualSlot(slot, idx)}
                                
                                {/* Slot Label (Side) */}
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
            <div className="w-full lg:w-96 flex flex-col bg-white border-l">
                <div className="p-4 border-b bg-slate-50">
                    <h3 className="font-bold text-slate-800">Select Components</h3>
                    <p className="text-xs text-slate-500">Click a component below to fill the next empty slot.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Component List */}
                    {availableComponents.map(comp => (
                        <div key={comp.id} className="flex flex-col gap-2 p-3 border rounded-lg hover:border-blue-400 transition-colors bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {/* Icon Preview */}
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getComponentColor(comp).bg} ${getComponentColor(comp).border} ${getComponentColor(comp).text}`}>
                                        <div className="scale-50">{getComponentIcon(comp)}</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-700">{comp.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{comp.partNumber}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Add Button */}
                            <button 
                                onClick={() => {
                                    const firstEmptyIndex = slots.findIndex(s => s.componentId === 'empty');
                                    if (firstEmptyIndex !== -1) {
                                        updateSlot(firstEmptyIndex, comp.id);
                                    } else {
                                        alert("Enclosure is full! Clear a slot first.");
                                    }
                                }}
                                className="mt-2 w-full py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1"
                            >
                                <Plus size={12}/> Add to Pendant
                            </button>
                        </div>
                    ))}
                </div>

                {/* Active Slots Management */}
                <div className="p-4 border-t bg-slate-50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Current Configuration</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto mb-4">
                        {slots.map((slot, idx) => {
                            const activeComp = componentTypes.find(c => c.id === slot.componentId);
                            if (slot.componentId === 'empty' || slot.componentId === 'linked') return null;
                            
                            return (
                                <div key={slot.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                                    <span className="font-mono text-slate-400">#{idx + 1}</span>
                                    <span className="font-medium truncate flex-1 mx-2">{activeComp?.name}</span>
                                    <button 
                                        onClick={() => updateSlot(slot.id, 'empty')}
                                        className="text-red-400 hover:text-red-600 p-1"
                                        title="Remove"
                                    >
                                        <X size={12}/>
                                    </button>
                                </div>
                            );
                        })}
                        {slots.every(s => s.componentId === 'empty') && (
                            <div className="text-xs text-slate-400 italic text-center py-2">Pendant is empty</div>
                        )}
                    </div>
                    
                    {/* --- NEXT STEP BUTTON --- */}
                    {isComplete && (
                        <button
                            onClick={() => setStep(4)}
                            className="w-full mt-4 px-6 py-3 rounded-lg bg-green-600 text-white font-bold shadow-lg shadow-green-900/40 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Review and Finalize <ChevronRight size={18}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}