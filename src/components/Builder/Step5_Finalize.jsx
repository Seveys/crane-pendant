import React, { useMemo, useState } from 'react';
import { Zap, CheckCircle, Settings, ArrowUpDown, AlertTriangle, Plug, List, Package, Disc, X, Save } from 'lucide-react';

const WARNING_LABEL_KCID = '55025367';

export default function Step5_Finalize({ builder }) {
    const { 
        enclosure, slots, componentTypes, accessories, 
        activeManufacturer, seriesData,
        liftHeight, selectedAccessories, activeCable, 
        recommendedGrip, odValidation, activeCableOD,
        manufacturers, matchedPreconfig, saveConfig, wiring, extraSlots // Added extraSlots
    } = builder;

    const [showDetailedBOM, setShowDetailedBOM] = useState(false);
    const [includeWarningLabel, setIncludeWarningLabel] = useState(true);

    const componentBreakdown = useMemo(() => {
        const componentMap = slots.reduce((acc, slot) => { 
            if (slot.componentId === 'empty' || slot.componentId === 'linked') return acc; 
            const comp = componentTypes.find(c => c.id === slot.componentId); 
            if (!comp) return acc; 
            if (!acc[comp.id]) acc[comp.id] = { ...comp, count: 0 }; 
            acc[comp.id].count++; 
            return acc; 
        }, {});

        // --- ADD EXTRA SLOTS TO MAP ---
        if (extraSlots && extraSlots.large) {
            const comp = componentTypes.find(c => c.id === extraSlots.large);
            if(comp) {
                if(!componentMap[comp.id]) componentMap[comp.id] = { ...comp, count: 0 };
                componentMap[comp.id].count++;
            }
        }
        if (extraSlots && extraSlots.small) {
            const comp = componentTypes.find(c => c.id === extraSlots.small);
            if(comp) {
                if(!componentMap[comp.id]) componentMap[comp.id] = { ...comp, count: 0 };
                componentMap[comp.id].count++;
            }
        }

        const bom = [];
        
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
        
        Object.values(componentMap).forEach(comp => {
            bom.push({
                kcid: comp.kcid,
                partNumber: comp.partNumber || '-',
                description: comp.name,
                qty: comp.count,
                isComponent: true
            });
        });

        if (activeCable && liftHeight) {
            bom.push({
                kcid: activeCable.kcid,
                partNumber: activeCable.part,
                description: `${activeCable.description || activeCable.type} (${activeCable.conductors}C, Spare: ${activeCable.conductors - wiring.totalConductors})`,
                qty: `${parseInt(liftHeight) + 5} ft`,
                isCable: true
            });
        }

        if (recommendedGrip) {
             bom.push({
                kcid: recommendedGrip.kcid,
                partNumber: recommendedGrip.part,
                description: `Cord Grip (${recommendedGrip.od_min_display} - ${recommendedGrip.od_max_display})`,
                qty: 1,
                isGrip: true
            });
        }

        selectedAccessories.forEach(accId => { 
            const acc = accessories.find(a => a && a.id === accId); 
            if (acc && acc.kcid !== WARNING_LABEL_KCID) {
                bom.push({
                    kcid: acc.kcid,
                    partNumber: acc.id,
                    description: acc.name,
                    qty: 1,
                    isAccessory: true
                });
            }
        });
        
        if (includeWarningLabel) {
            bom.push({
                kcid: WARNING_LABEL_KCID,
                partNumber: 'Safety-Warning-Label',
                description: 'Mandatory Safety Warning Label',
                qty: 1,
                isWarning: true
            });
        }

        return bom;
    }, [enclosure, slots, extraSlots, componentTypes, manufacturers, activeManufacturer, activeCable, recommendedGrip, selectedAccessories, accessories, liftHeight, includeWarningLabel, wiring.totalConductors, wiring]);
    
    // --- RENDER HELPERS ---
    const renderOdWarning = () => {
        if (!enclosure || odValidation === 'ok' || odValidation === null) return null;
        const encMin = enclosure.accepted_od_min;
        const encMax = enclosure.accepted_od_max;
        const odValue = activeCableOD !== null && activeCableOD !== undefined ? activeCableOD.toFixed(3) : '-';
        const minDisplay = encMin !== null && encMin !== undefined ? encMin.toFixed(3) : '-';
        const maxDisplay = encMax !== null && encMax !== undefined ? encMax.toFixed(3) : '-';
        
        let message = "The selected cable OD is outside the enclosure's specified limits.";
        let recommendation = "Review cable or return to Step 4 to change selection.";
        
        if (odValidation === 'too_small') {
            message = `Cable OD (${odValue}") is too small.`;
            recommendation = `Requires OD $\ge$ ${minDisplay}".`;
        } else if (odValidation === 'too_large') {
            message = `Cable OD (${odValue}") is too large.`;
            recommendation = `Requires OD $\le$ ${maxDisplay}".`;
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
                <Package className="text-green-500"/> Step 5: Bill of Materials & Finalize
            </h2>

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
            
            <div className="bg-slate-100 p-6 border-t border-slate-200 rounded-lg">
                <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider flex justify-between items-center">
                    Final Bill of Materials
                    {matchedPreconfig && (
                         <button type="button" onClick={() => setShowDetailedBOM(!showDetailedBOM)} className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 transition-colors" style={{ backgroundColor: showDetailedBOM ? '#3B82F6' : '#E5E7EB', color: showDetailedBOM ? 'white' : '#4B5563' }}>
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
                            {matchedPreconfig && !showDetailedBOM ? (
                                <tr className="bg-green-50/50">
                                    <td className="p-3 font-mono text-green-700 font-bold">{matchedPreconfig.kcid}</td>
                                    <td className="p-3 font-bold text-green-800">{matchedPreconfig.modelNumber}</td>
                                    <td className="p-3 text-slate-700">
                                        <div className="font-semibold">{matchedPreconfig.description}</div>
                                        <div className="text-xs text-green-600 mt-1">Pre-Configured Assembly</div>
                                    </td>
                                    <td className="p-3 text-right font-bold">1</td>
                                </tr>
                            ) : (
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

                <div className="mt-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center p-2 rounded border border-red-300 bg-red-50">
                        <input type="checkbox" checked={includeWarningLabel} onChange={(e) => setIncludeWarningLabel(e.target.checked)} className="mr-3 w-4 h-4 text-red-600 bg-red-100 border-red-400 focus:ring-red-500"/>
                        <div className="text-sm font-semibold text-red-700">Include Safety Warning Label (KCID: {WARNING_LABEL_KCID})</div>
                    </label>
                    <p className="text-xs text-red-600 mt-1 pl-6">Deselecting this will remove the item from the BOM, but it is required for final assembly.</p>
                </div>

                 {!matchedPreconfig && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => saveConfig({ customer: 'Saved User Config', location: 'Custom Build', assetId: 'N/A' })} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Save size={18}/> Save Custom Configuration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}