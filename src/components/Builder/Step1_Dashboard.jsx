import React, { useState, useMemo } from 'react';
import { Box, Grid, ChevronRight, Clock, MapPin } from 'lucide-react';

export default function Step1_Dashboard({ builder, popularConfigs = [], myBuilds = [], onLoadConfig }) {
    const { 
        manufacturers, seriesData, setStep, 
        setActiveManufacturer, setEnclosure, setSlots 
    } = builder;

    const [browseMode, setBrowseMode] = useState('brand'); // 'brand' | 'capacity'
    const [selectedButtonCount, setSelectedButtonCount] = useState(null);
    const [dashboardTab, setDashboardTab] = useState('trending'); 

    // --- HELPER: FLATTEN ENCLOSURES FOR "SHOP BY CAPACITY" ---
    const allEnclosuresFlat = useMemo(() => {
        const all = [];
        Object.keys(seriesData).forEach(mfgId => {
            // Find manufacturer to check if active
            const manufacturer = manufacturers.find(m => m.id === mfgId);
            // Only include if manufacturer exists AND is active
            if (manufacturer && manufacturer.isActive) {
                const mfgData = seriesData[mfgId];
                if(mfgData) {
                    mfgData.enclosures.forEach(enc => {
                        all.push({ ...enc, manufacturerId: mfgId, manufacturerName: manufacturer.name, manufacturerImage: manufacturer.image });
                    });
                }
            }
        });
        return all;
    }, [seriesData, manufacturers]);

    const availableButtonCounts = useMemo(() => {
        const counts = new Set(allEnclosuresFlat.map(e => e.holes));
        return Array.from(counts).sort((a,b) => a - b);
    }, [allEnclosuresFlat]);

    // --- HANDLER: START NEW BUILD ---
    const handleStartBuild = (mfgId, enc = null) => {
        setActiveManufacturer(mfgId);
        if (enc) {
            setEnclosure(enc);
            setSlots(Array(enc.holes).fill(null).map((_, i) => ({ id: i, componentId: 'empty' })));
            setStep(3); // Jump straight to config if enclosure is picked
        } else {
            setStep(2); // Go to enclosure selection
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 h-full">
            {/* MAIN SELECTION AREA */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Start Your Configuration</h2>
                    <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                        <button onClick={() => setBrowseMode('brand')} className={`px-4 py-2 rounded transition-all ${browseMode === 'brand' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Shop by Brand</button>
                        <button onClick={() => setBrowseMode('capacity')} className={`px-4 py-2 rounded transition-all ${browseMode === 'capacity' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Shop by Capacity</button>
                    </div>
                </div>

                {browseMode === 'brand' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* UPDATED: FILTER BY m.isActive */}
                        {manufacturers.filter(m => m.isActive).map((m) => (
                            <button key={m.id} onClick={() => handleStartBuild(m.id)} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-blue-500 hover:shadow-lg transition-all bg-white group overflow-hidden relative h-32">
                                {m.image ? 
                                    <img src={m.image} className="w-full h-16 object-contain mb-2" alt={m.name} /> : 
                                    <div className={`w-12 h-12 ${m.color || 'bg-slate-500'} rounded-full mb-2 flex items-center justify-center text-white font-bold text-xl shadow-sm`}>{m.name.charAt(0)}</div>
                                }
                                <span className="font-semibold text-sm text-slate-700 text-center leading-tight">{m.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {availableButtonCounts.map(count => (
                                <button 
                                    key={count} 
                                    onClick={() => setSelectedButtonCount(count)}
                                    className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${selectedButtonCount === count ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 hover:border-blue-400'}`}
                                >
                                    {count} Buttons
                                </button>
                            ))}
                        </div>
                        
                        {selectedButtonCount ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {allEnclosuresFlat.filter(enc => enc.holes === selectedButtonCount).map((enc, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => handleStartBuild(enc.manufacturerId, enc)} 
                                        className="flex flex-col p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left bg-white items-center text-center group relative overflow-hidden"
                                    >
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{enc.manufacturerName}</div>
                                        <div className="w-20 h-24 mb-2 mt-4 flex items-center justify-center">
                                            {enc.image ? <img src={enc.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"/> : <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300"><Box size={24}/></div>}
                                        </div>
                                        <div className="font-bold text-slate-800 text-sm">{enc.model}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1">{enc.kcid}</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                                <Grid size={48} className="mx-auto mb-2 text-slate-300"/>
                                <p>Select a button count to view compatible enclosures from all manufacturers.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* SIDEBAR (TRENDING / SAVED) */}
            <div className="w-full md:w-80 border-l pl-0 md:pl-8 flex flex-col">
                <div className="flex items-center gap-4 mb-4 border-b pb-2">
                    <button onClick={() => setDashboardTab('trending')} className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${dashboardTab === 'trending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Trending</button>
                    <button onClick={() => setDashboardTab('my-builds')} className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${dashboardTab === 'my-builds' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>My Saved Builds</button>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2">
                    {dashboardTab === 'trending' ? (
                        popularConfigs.length > 0 ? popularConfigs.map((build, idx) => (
                            <button key={idx} onClick={() => onLoadConfig(build)} className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all bg-slate-50 group">
                                <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{build.manufacturerName}</span><ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500"/></div>
                                <div className="font-bold text-slate-800 text-sm">{build.enclosureModel}</div>
                                <div className="text-xs text-slate-500 mt-1">{build.slotIds.length} Component Slots</div>
                            </button>
                        )) : <div className="text-center text-slate-400 text-sm py-8">No trending data available.</div>
                    ) : (
                        myBuilds.length === 0 ? <div className="text-center text-slate-400 text-sm py-8">No saved builds yet.</div> :
                        myBuilds.map((build, idx) => (
                            <button key={idx} onClick={() => onLoadConfig(build)} className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all bg-white group shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> {build.timestamp ? new Date(build.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500"/>
                                </div>
                                <div className="font-bold text-slate-800 text-sm mb-1">{build.meta_customer || 'Unnamed Project'}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {build.meta_location || 'No Location'}</div>
                                <div className="text-xs text-slate-400 mt-2 pt-2 border-t flex justify-between"><span>{build.enclosureModel}</span><span>{build.manufacturerName}</span></div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}