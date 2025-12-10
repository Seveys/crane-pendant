import React, { useMemo, useState } from 'react';
import { Zap, CheckCircle, Settings, ArrowUpDown, AlertTriangle, Plug, List, Package, Disc, X, Save } from 'lucide-react';

export default function Step4_Summary({ builder }) {
    const { 
        enclosure, slots, componentTypes, accessories, 
        activeManufacturer, seriesData,
        liftHeight, setLiftHeight, 
        selectedAccessories, setSelectedAccessories,
        recommendedCable, recommendedGrip, odValidation, activeCableOD,
        manufacturers, matchedPreconfig, saveConfig 
    } = builder;

    const [showDetailedBOM, setShowDetailedBOM] = useState(false);
    // State for non-optional warning label (starts as true per requirement)
    const [includeWarningLabel, setIncludeWarningLabel] = useState(true);

    // --- CALCULATE COMPONENT BREAKDOWN ---
    const componentBreakdown = useMemo(() => {
        const componentMap = slots.reduce((acc, slot) => { 
            if (slot.componentId === 'empty' || slot.componentId === 'linked') return acc; 
            const comp = componentTypes.find(c => c.id === slot.componentId); 
            if (!comp) return acc; 
            if (!acc[comp.id]) acc[comp.id] = { ...comp, count: 0 }; 
            acc[comp.id].count++; 
            return acc; 
        }, {});

        const bom = [];
        
        // 1. Add enclosure
        if (enclosure) {
            const mfgName = manufacturers.find(m => m.id === activeManufacturer)?.name || activeManufacturer;
            bom.push({
                kcid: enclosure.kcid,
                partNumber: enclosure.model,
                description: `${mfgName} Enclosure (${enclosure.model})`,
                qty: 1,
                isEnclosure: true
            });
        }
        
        // 2. Add individual components
        Object.values(componentMap).forEach(comp => {
            bom.push({
                kcid: comp.kcid,
                partNumber: comp.partNumber || '-',
                description: comp.name,
                qty: comp.count,
                isComponent: true
            });
        });

        // 3. Add recommended cable (if ordered)
        if (recommendedCable) {
            bom.push({
                kcid: recommendedCable.kcid,
                partNumber: recommendedCable.part,
                description: `${recommendedCable.description || recommendedCable.type} (${recommendedCable.conductors}C, Spare: ${recommendedCable.conductors - builder.wiring.totalConductors})`,
                qty: `${liftHeight ? (parseInt(liftHeight) + 5) : 'AR'} ft`,
                isCable: true
            });
        }

        // 4. Add recommended grip (if found)
        if (recommendedGrip) {
             bom.push({
                kcid: recommendedGrip.kcid,
                partNumber: recommendedGrip.part,
                description: `Cord Grip (${recommendedGrip.od_min_display} - ${recommendedGrip.od_max_display})`,
                qty: 1,
                isGrip: true
            });
        }

        // 5. Add selected accessories
        selectedAccessories.forEach(accId => { 
            const acc = accessories.find(a => a.id === accId); 
            if (acc) {
                bom.push({
                    kcid: acc.kcid,
                    partNumber: acc.id,
                    description: acc.name,
                    qty: 1,
                    isAccessory: true
                });
            }
        });
        
        // 6. Add Warning Label (Conditional, controlled by state)
        if (includeWarningLabel) {
            bom.push({
                kcid: 'WARNING-LABEL',
                partNumber: 'Safety-Warning-Label',
                description: 'Mandatory Safety Warning Label',
                qty: 1,
                isWarning: true
            });
        }

        return bom;
    }, [enclosure, slots, componentTypes, manufacturers, activeManufacturer, recommendedCable, recommendedGrip, selectedAccessories, accessories, liftHeight, includeWarningLabel, builder.wiring.totalConductors]);
    
    // --- RENDER HELPERS ---
    const renderOdWarning = () => {
        if (!enclosure || odValidation === 'ok' || odValidation === null) return null;
        
        // FIX for TypeError: Safely access OD values, defaulting to null/undefined check
        const encMin = enclosure.accepted_od_min;
        const encMax = enclosure.accepted_od_max;
        
        // Safely format the display values, defaulting to '-' if null
        const odValue = activeCableOD !== null && activeCableOD !== undefined ? activeCableOD.toFixed(3) : '-';
        const minDisplay = encMin !== null && encMin !== undefined ? encMin.toFixed(3) : '-';
        const maxDisplay = encMax !== null && encMax !== undefined ? encMax.toFixed(3) : '-';
        
        let message = "The selected cable OD is outside the enclosure's specified limits.";
        let recommendation = "You must select a smaller/larger cable or switch to an enclosure with a different entry diameter.";
        
        if (odValidation === 'too_small') {
            message = `Cable OD (${odValue}") is too small.`;
            recommendation = `Requires OD $\ge$ ${minDisplay}". Consider a cord grip with a smaller range or a different enclosure.`;
        } else if (odValidation === 'too_large') {
            message = `Cable OD (${odValue}") is too large.`;
            recommendation = `Requires OD $\le$ ${maxDisplay}". Change your cable selection or pick a larger enclosure/bushing option.`;
        }

        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                <h4 className="flex items-center gap-2 text-red-700 font-bold"><X size={18} /> WARNING: Enclosure Physical Mismatch</h4>
                <p className="text-sm text-red-600 mt-1">{message}</p>
                <p className="text-xs text-red-800 mt-1">{recommendation}</p>
            </div>
        );
    };

    // --- MAIN RENDER ---
    const displayBOM = showDetailedBOM ? componentBreakdown : [];

    return (
        <div className="flex flex-col gap-8">
            {/* TOP SECTION: CALCS & ACCESSORIES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COL: CALCULATIONS */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> System Calculations
                    </h3>
                    
                    {renderOdWarning()}

                    {matchedPreconfig ? (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
                            <h4 className="flex items-center gap-2 text-green-700 font-bold"><CheckCircle size={18} /> Standard Configuration Detected</h4>
                            <p className="text-sm text-green-600 mt-1">Matched assembly <strong>{matchedPreconfig.modelNumber}</strong>.</p>
                            <div className="mt-2 text-sm font-mono text-green-800 bg-green-100 p-1 rounded inline-block">
                                KCID: {matchedPreconfig.kcid}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
                            <h4 className="flex items-center gap-2 text-blue-700 font-bold"><Settings size={18} /> Custom Configuration</h4>
                        </div>
                    )}
                    
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
                                <div className="text-xl font-bold text-blue-600">{liftHeight ? parseInt(liftHeight) + 5 : '--'} <span className="text-sm text-slate-400">ft</span></div>
                                <div className="text-[10px] text-slate-400 leading-tight">+5ft Makeup Included</div>
                            </div>
                        </div>
                    </div>

                    {/* CABLE & GRIP RESULT */}
                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-3">Recommended Items</h4>
                        <div className="space-y-4">
                            {/* Cable */}
                            <div className="border-b pb-3">
                                <div className="text-sm font-bold text-slate-700 mb-1">Cable</div>
                                {recommendedCable ? (
                                    <div className="flex items-center gap-4">
                                        {recommendedCable.image && <img src={recommendedCable.image} className="w-10 h-10 object-contain rounded border"/>}
                                        <div>
                                            <div className="text-base font-bold text-blue-600">{recommendedCable.description || recommendedCable.type}</div>
                                            <div className="text-xs font-mono text-slate-500 bg-slate-100 p-1 rounded inline-block">P/N: {recommendedCable.part} (OD: {activeCableOD !== null && activeCableOD !== undefined ? activeCableOD.toFixed(3) : '-'})</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-500 flex items-center gap-2 text-sm"><AlertTriangle size={18} /> Cable requirements not met.</div>
                                )}
                            </div>
                            {/* Cord Grip */}
                            <div>
                                <div className="text-sm font-bold text-slate-700 mb-1">Cord Grip</div>
                                {recommendedGrip ? (
                                    <div className="flex items-center gap-4">
                                        <Disc size={32} className="text-slate-400 shrink-0"/>
                                        <div>
                                            <div className="text-base font-bold text-blue-600">{recommendedGrip.part}</div>
                                            <div className="text-xs font-mono text-slate-500 bg-slate-100 p-1 rounded inline-block">Range: {recommendedGrip.od_min_display} - {recommendedGrip.od_max_display}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-500 flex items-center gap-2 text-sm"><AlertTriangle size={18} /> No suitable cord grip found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: ACCESSORIES */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plug className="text-slate-500" /> Accessories</h3>
                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-3">Optional Add-ons</h4>
                        <div className="space-y-2">
                            {accessories.map(acc => (
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

            {/* BOTTOM: BILL OF MATERIALS (BOM) */}
            <div className="bg-slate-100 p-6 border-t border-slate-200 mt-4 rounded-b-xl">
                <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex justify-between items-center">
                    Bill of Materials (BOM)
                    
                    {/* BOM TOGGLE BUTTON */}
                    {matchedPreconfig && (
                         <button 
                            type="button" 
                            onClick={() => setShowDetailedBOM(!showDetailedBOM)} 
                            className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 transition-colors"
                            style={{ 
                                backgroundColor: showDetailedBOM ? '#3B82F6' : '#E5E7EB',
                                color: showDetailedBOM ? 'white' : '#4B5563' 
                            }}
                        >
                            {showDetailedBOM ? <List size={14}/> : <Package size={14}/>}
                            {showDetailedBOM ? 'Show Assembly Part #' : 'Show Detailed Components'}
                        </button>
                    )}
                </h4>
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                            <tr>
                                <th className="p-3">KCID</th>
                                <th className="p-3">Part #</th>
                                <th className="p-3">Description</th>
                                <th className="p-3 text-right">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {/* --- CONDITIONAL RENDERING --- */}
                            {matchedPreconfig && !showDetailedBOM ? (
                                // Show only the Pre-Config assembly
                                <tr className="bg-green-50/50">
                                    <td className="p-3 font-mono text-green-700 font-bold">
                                        {matchedPreconfig.kcid}
                                    </td>
                                    <td className="p-3 font-bold text-green-800">{matchedPreconfig.modelNumber}</td>
                                    <td className="p-3 text-slate-700">
                                        <div className="font-semibold">{matchedPreconfig.description}</div>
                                        <div className="text-xs text-green-600 mt-1">Pre-Configured Assembly</div>
                                    </td>
                                    <td className="p-3 text-right font-bold">1</td>
                                </tr>
                            ) : (
                                // Show the detailed component breakdown (either custom or when toggled)
                                componentBreakdown.map((item, index) => (
                                    <tr key={index} className={item.isEnclosure ? 'bg-slate-50' : item.isWarning ? 'bg-red-50/50' : ''}>
                                        <td className="p-3 font-mono text-blue-600">{item.kcid}</td>
                                        <td className="p-3 font-medium">{item.partNumber}</td>
                                        <td className="p-3 text-slate-600">{item.description}</td>
                                        <td className="p-3 text-right">{item.qty}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* WARNING LABEL CHECKBOX (Non-optional) */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center p-2 rounded border border-red-300 bg-red-50">
                        <input 
                            type="checkbox" 
                            checked={includeWarningLabel} 
                            onChange={(e) => setIncludeWarningLabel(e.target.checked)} 
                            className="mr-3 w-4 h-4 text-red-600 bg-red-100 border-red-400 focus:ring-red-500"
                        />
                        <div className="text-sm font-semibold text-red-700">
                            Include Safety Warning Label (Mandatory for ordering)
                        </div>
                    </label>
                    <p className="text-xs text-red-600 mt-1 pl-6">
                        Deselecting this will remove the item from the BOM, but it is required for final assembly.
                    </p>
                </div>

                {/* --- SAVE CONFIG BUTTON (CONDITIONAL DISPLAY) --- */}
                 {!matchedPreconfig && (
                    <div className="mt-6 flex justify-end">
                        <button
                            // This button should likely open the save modal in App.jsx. 
                            // Since we don't have access to the original handler, we call saveConfig directly here.
                            onClick={() => saveConfig({ customer: 'Saved User Config', location: 'Custom Build', assetId: 'N/A' })}
                            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Save size={18}/> Save Configuration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}