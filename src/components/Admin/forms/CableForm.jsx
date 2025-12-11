import React, { useState, useMemo } from 'react';
import { toDecimalInches } from '../../../utils/units';

// The 'props' passed to AdminForms includes access to seriesData
export default function CordGripForm({ editItem, dbActions, seriesData, onCancel, onSaveSuccess }) { 
    
    // Convert current compatible array to a Set for quick lookup in JSX
    const [compatibleSeries, setCompatibleSeries] = useState(new Set(editItem?.compatibleSeries || []));

    // Get all unique series IDs from all manufacturers
    const allSeriesIds = useMemo(() => {
        const ids = new Set();
        Object.entries(seriesData).forEach(([mfgId, series]) => {
             series.enclosures.forEach(enc => ids.add(enc.series));
        });
        return Array.from(ids).sort();
    }, [seriesData]);


    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Convert inputs to Standard Decimal Inches for logic
        const minRaw = formData.get('od_min_input');
        const maxRaw = formData.get('od_max_input');

        const newItem = {
            id: editItem?.id || `cg-${Date.now()}`,
            part: formData.get('part'),
            description: formData.get('description'),
            thread: formData.get('thread'),
            
            // Save compatibility array
            compatibleSeries: Array.from(compatibleSeries), // <--- SAVED SERIES ARRAY
            
            // Save raw input for display (e.g. "12mm")
            od_min_display: minRaw,
            od_max_display: maxRaw,
            
            // Save converted values for logic (e.g. 0.472)
            od_min: toDecimalInches(minRaw),
            od_max: toDecimalInches(maxRaw)
        };

        dbActions.saveCordGrip(newItem);
        onSaveSuccess();
    };

    const handleSeriesToggle = (seriesId) => {
        setCompatibleSeries(prev => {
            const next = new Set(prev);
            if (next.has(seriesId)) {
                next.delete(seriesId);
            } else {
                next.add(seriesId);
            }
            return next;
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Cord Grip</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-xs font-bold">Part Number</label>
                    <input name="part" defaultValue={editItem?.part} required className="w-full border p-2 rounded" />
                </div>
                
                <div className="col-span-2">
                    <label className="text-xs font-bold">Description</label>
                    <input name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="text-xs font-bold">Thread Type</label>
                    <input name="thread" placeholder="e.g. NPT 1/2" defaultValue={editItem?.thread} className="w-full border p-2 rounded" />
                </div>

                {/* OD RANGE */}
                <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border">
                    <div className="col-span-2 text-xs font-bold text-slate-500 uppercase">Cable OD Range</div>
                    <div>
                        <label className="text-xs font-bold">Min OD</label>
                        <input name="od_min_input" placeholder='e.g. 0.375 or 10mm' defaultValue={editItem?.od_min_display} required className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold">Max OD</label>
                        <input name="od_max_input" placeholder='e.g. 0.500 or 1/2' defaultValue={editItem?.od_max_display} required className="w-full border p-2 rounded" />
                    </div>
                    <div className="col-span-2 text-[10px] text-slate-400">
                        * Supports decimals (0.5), fractions (1/2), or millimeters (12mm). System auto-converts.
                    </div>
                </div>
                
                {/* COMPATIBLE ENCLOSURE SERIES */}
                <div className="col-span-2 pt-4 border-t">
                    <label className="text-xs font-bold block mb-2">Compatible Enclosure Series</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-3 rounded">
                        {allSeriesIds.length > 0 ? (
                            allSeriesIds.map(seriesId => (
                                <button
                                    key={seriesId}
                                    type="button"
                                    onClick={() => handleSeriesToggle(seriesId)}
                                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                                        compatibleSeries.has(seriesId) 
                                            ? 'bg-blue-600 text-white border-blue-700' 
                                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {seriesId}
                                </button>
                            ))
                        ) : (
                             <p className="text-sm text-slate-500">No enclosure series defined yet.</p>
                        )}
                    </div>
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button>
                </div>
            </form>
        </div>
    );
}