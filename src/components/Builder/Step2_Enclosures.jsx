import React, { useMemo } from 'react';
import { Box } from 'lucide-react';

export default function Step2_Enclosures({ builder }) {
    const { activeManufacturer, seriesData, setEnclosure, setSlots, setStep } = builder;

    // Get data for the active manufacturer
    const activeSeriesData = seriesData[activeManufacturer] || seriesData['default'];

    // Group enclosures by series name for display
    const groupedEnclosures = useMemo(() => {
        if (!activeSeriesData) return {};
        return activeSeriesData.enclosures.reduce((acc, enc) => { 
            if (!acc[enc.series]) acc[enc.series] = []; 
            acc[enc.series].push(enc); 
            return acc; 
        }, {});
    }, [activeSeriesData]);

    const handleSelectEnclosure = (enc) => {
        setEnclosure(enc);
        // Initialize slots based on hole count
        setSlots(Array(enc.holes).fill(null).map((_, i) => ({ id: i, componentId: 'empty' })));
        setStep(3);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Select {activeSeriesData?.name || 'Enclosure'} Model</h2>
            
            {Object.entries(groupedEnclosures).map(([seriesName, enclosures]) => (
                <div key={seriesName} className="mb-6">
                    <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b pb-1">{seriesName} Enclosures</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {enclosures.map((enc, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSelectEnclosure(enc)} 
                                className="flex flex-col p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left bg-white items-center text-center group"
                            >
                                <div className="w-20 h-24 mb-2 flex items-center justify-center">
                                    {enc.image ? 
                                        <img src={enc.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" alt={enc.model}/> : 
                                        <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300"><Box size={24}/></div>
                                    }
                                </div>
                                <div className="font-bold text-slate-800 text-sm">{enc.model}</div>
                                <div className="text-xs text-slate-500">{enc.holes} Holes</div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}