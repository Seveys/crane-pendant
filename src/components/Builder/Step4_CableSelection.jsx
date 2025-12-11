import React from 'react';
import { Zap, ArrowUpDown, Plug, ChevronRight, AlertTriangle, X, Disc } from 'lucide-react';
import CableSelectionTable from './CableSelectionTable'; 

export default function Step4_CableSelection({ builder }) {
    const {
        enclosure, 
        wiring,
        cables,
        recommendedCable,
        activeCable, 
        userSelectedCable, setUserSelectedCable, 
        customCableOD, setCustomCableOD,
        liftHeight, setLiftHeight,
        selectedAccessories, setSelectedAccessories,
        recommendedGrip, odValidation, isGripRequired, activeCableOD, // <-- Added isGripRequired
        accessories,
        setStep
    } = builder;

    const selectableAccessories = accessories.filter(acc => acc.kcid !== '55025367');
    const isCableSelected = activeCable || customCableOD;
    
    // --- RENDER HELPERS ---
    const renderOdWarning = () => {
        // If we have a valid recommended grip to solve the issue, we don't show the red error
        if (recommendedGrip || !enclosure || odValidation === 'ok' || odValidation === null) return null;
        
        const encMin = enclosure.accepted_od_min;
        const encMax = enclosure.accepted_od_max;
        
        const odValue = activeCableOD !== null && activeCableOD !== undefined ? activeCableOD.toFixed(3) : '-';
        const minDisplay = encMin !== null && encMin !== undefined ? encMin.toFixed(3) : '-';
        const maxDisplay = encMax !== null && encMax !== undefined ? encMax.toFixed(3) : '-';
        
        let message = `Cable OD (${odValue}") is too small.`;
        let recommendation = `Requires OD ≥ ${minDisplay}".`;
        
        if (odValidation === 'too_large') {
            message = `Cable OD (${odValue}") is too large.`;
            recommendation = `Requires OD ≤ ${maxDisplay}".`;
        }

        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm mb-6">
                <h4 className="flex items-center gap-2 text-red-700 font-bold"><X size={18} /> WARNING: Enclosure Physical Mismatch</h4>
                <p className="text-sm text-red-600 mt-1">{message}</p>
                <p className="text-xs text-red-800 mt-1">{recommendation}</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Zap className="text-yellow-500"/> Step 4: Cable, Cord Grip, & Accessories
            </h2>

            {renderOdWarning()}

            {/* CABLE SELECTION TABLE */}
            <CableSelectionTable
                allCables={cables}
                wiring={wiring}
                enclosure={enclosure}
                recommendedCable={recommendedCable}
                activeCable={activeCable}
                currentCableOD={customCableOD}
                setCustomCableOD={setCustomCableOD}
                setActiveCable={setUserSelectedCable} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COL: LIFT HEIGHT & GRIP */}
                <div className="space-y-6">
                    {/* LIFT HEIGHT INPUT */}
                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><ArrowUpDown size={18} className="text-blue-500"/> Cable Length Requirements</h4>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Height of Lift (ft)</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="20" value={liftHeight} onChange={(e) => setLiftHeight(e.target.value)} />
                            </div>
                            <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Cable</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {liftHeight ? parseInt(liftHeight) + 5 : '--'} <span className="text-sm text-slate-400">ft</span>
                                </div>
                                <div className="text-[10px] text-slate-400 leading-tight">+5ft Makeup Included</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* CORD GRIP RESULT (CONDITIONAL) */}
                    {recommendedGrip && (
                        <div className="bg-white border rounded-xl p-5 shadow-sm">
                            <h4 className="font-semibold text-slate-700 mb-3">Cord Grip Recommendation</h4>
                            <div className="flex items-center gap-4 mb-3">
                                <Disc size={32} className="text-slate-400 shrink-0"/>
                                <div>
                                    <div className="text-base font-bold text-blue-600">{recommendedGrip.part}</div>
                                    <div className="text-xs font-mono text-slate-500 bg-slate-100 p-1 rounded inline-block">Range: {recommendedGrip.od_min_display} - {recommendedGrip.od_max_display}</div>
                                </div>
                            </div>
                            
                            {/* DEPTH WARNING (If grip is required due to mismatch) */}
                            {isGripRequired && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded text-xs text-yellow-800 flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
                                    <span>
                                        <strong>Warning:</strong> Changing just the cord grip may result in an enclosure that is too shallow for the amount of wires. Verify enclosure depth requirements.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COL: ACCESSORIES */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plug className="text-slate-500" /> Optional Accessories</h3>
                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-3">Optional Add-ons</h4>
                        <div className="space-y-2">
                            {selectableAccessories.map(acc => (
                                <label key={acc.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedAccessories.includes(acc.id)} 
                                        onChange={(e) => { 
                                            if(e.target.checked) setSelectedAccessories([...selectedAccessories, acc.id]); 
                                            else setSelectedAccessories(selectedAccessories.filter(id => id !== acc.id)); 
                                        }} 
                                    />
                                    {acc.image ? 
                                        <img src={acc.image} className="w-10 h-10 object-contain border bg-white p-1 rounded"/> : 
                                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center"><Plug size={16} className="text-slate-400"/></div>
                                    }
                                    <div>
                                        <div className="font-semibold text-sm">{acc.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">{acc.kcid}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* NEXT STEP BUTTON */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => setStep(5)} 
                    disabled={!isCableSelected}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    Proceed to Final Review <ChevronRight size={18}/>
                </button>
            </div>
        </div>
    );
}