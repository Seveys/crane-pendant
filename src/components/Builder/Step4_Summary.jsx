import React, { useMemo } from 'react';
import { Zap, CheckCircle, Settings, ArrowUpDown, AlertTriangle, Plug } from 'lucide-react';

export default function Step4_Summary({ builder }) {
    const { 
        enclosure, slots, componentTypes, accessories, 
        activeManufacturer, seriesData,
        liftHeight, setLiftHeight, 
        selectedAccessories, setSelectedAccessories,
        recommendedCable 
    } = builder;

    // --- CALCULATE PRE-CONFIG MATCH ---
    const matchedPreconfig = useMemo(() => {
        const activeSeriesData = seriesData[activeManufacturer] || seriesData['default'];
        if (!enclosure || !activeSeriesData?.preconfigurations) return null;
        
        const currentSlotIds = slots.map(s => s.componentId);
        
        return activeSeriesData.preconfigurations.find(pre => {
            if (pre.enclosureId !== enclosure.id) return false;
            if (pre.slots.length !== currentSlotIds.length) return false;
            return pre.slots.every((sId, index) => sId === currentSlotIds[index]);
        });
    }, [enclosure, slots, seriesData, activeManufacturer]);

    return (
        <div className="flex flex-col gap-8">
            {/* TOP SECTION: CALCS & ACCESSORIES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COL: CALCULATIONS */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="text-yellow-500" /> System Calculations
                    </h3>
                    
                    {matchedPreconfig ? (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
                            <h4 className="flex items-center gap-2 text-green-700 font-bold"><CheckCircle size={18} /> Standard Configuration Detected</h4>
                            <p className="text-sm text-green-600 mt-1">Matched assembly <strong>{matchedPreconfig.modelNumber}</strong>.</p>
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

                    {/* CABLE RESULT */}
                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-3">Recommended Cable</h4>
                        {recommendedCable ? (
                            <div className="flex items-center gap-4">
                                {recommendedCable.image && <img src={recommendedCable.image} className="w-16 h-16 object-cover rounded border"/>}
                                <div>
                                    <div className="text-2xl font-bold text-blue-600 mb-1">{recommendedCable.type}</div>
                                    <div className="text-sm font-mono text-slate-500 bg-slate-100 p-1 rounded inline-block mb-2">KCID: {recommendedCable.kcid}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-red-500 flex items-center gap-2"><AlertTriangle size={18} /> No valid cable found.</div>
                        )}
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

            {/* BOTTOM: BILL OF MATERIALS */}
            <div className="bg-slate-100 p-6 border-t border-slate-200 mt-4 rounded-b-xl">
                <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Bill of Materials</h4>
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
                            {matchedPreconfig ? (
                                <tr className="bg-blue-50/50">
                                    <td className="p-3 font-mono text-blue-700 font-bold">PRE-CONFIG</td>
                                    <td className="p-3 font-bold text-blue-800">{matchedPreconfig.modelNumber}</td>
                                    <td className="p-3 text-slate-700">
                                        <div className="font-semibold">{matchedPreconfig.description}</div>
                                        <div className="text-xs text-slate-500 mt-1">Includes: {enclosure.model} Enclosure + Configured Inserts</div>
                                    </td>
                                    <td className="p-3 text-right font-bold">1</td>
                                </tr>
                            ) : (
                                <>
                                    <tr>
                                        <td className="p-3 font-mono text-blue-600">{enclosure?.kcid}</td>
                                        <td className="p-3 font-medium">{enclosure?.model}</td>
                                        <td className="p-3 text-slate-600">{activeManufacturer} - {enclosure?.model}</td>
                                        <td className="p-3 text-right">1</td>
                                    </tr>
                                    {/* Component Rows (Aggregated) */}
                                    {Object.values(slots.reduce((acc, slot) => { 
                                        if (slot.componentId === 'empty' || slot.componentId === 'linked') return acc; 
                                        const comp = componentTypes.find(c => c.id === slot.componentId); 
                                        if (!comp) return acc; 
                                        if (!acc[comp.id]) acc[comp.id] = { ...comp, count: 0 }; 
                                        acc[comp.id].count++; 
                                        return acc; 
                                    }, {})).map(comp => (
                                        <tr key={comp.id}>
                                            <td className="p-3 font-mono text-blue-600">{comp.kcid}</td>
                                            <td className="p-3 font-medium">{comp.partNumber || '-'}</td>
                                            <td className="p-3 text-slate-600">{comp.name}</td>
                                            <td className="p-3 text-right">{comp.count}</td>
                                        </tr>
                                    ))}
                                </>
                            )}
                            
                            {/* Cable Row */}
                            {recommendedCable && (
                                <tr>
                                    <td className="p-3 font-mono text-blue-600">{recommendedCable.kcid}</td>
                                    <td className="p-3 font-medium">{recommendedCable.part}</td>
                                    <td className="p-3 text-slate-600">{recommendedCable.type}</td>
                                    <td className="p-3 text-right font-bold">{liftHeight ? parseInt(liftHeight) + 5 : 'AR'} ft</td>
                                </tr>
                            )}
                            
                            {/* Accessories Rows */}
                            {selectedAccessories.map(accId => { 
                                const acc = accessories.find(a => a.id === accId); 
                                return (
                                    <tr key={accId}>
                                        <td className="p-3 font-mono text-blue-600">{acc.kcid}</td>
                                        <td className="p-3 font-medium">{acc.id}</td>
                                        <td className="p-3 text-slate-600">{acc.name}</td>
                                        <td className="p-3 text-right">1</td>
                                    </tr>
                                ); 
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}