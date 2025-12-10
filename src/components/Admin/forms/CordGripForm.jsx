import React, { useState } from 'react';
import { toDecimalInches } from '../../../utils/units';

export default function CordGripForm({ editItem, dbActions, onCancel, onSaveSuccess }) {
    
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

                <div className="col-span-2 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button>
                </div>
            </form>
        </div>
    );
}