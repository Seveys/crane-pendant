import React, { useState } from 'react';

export default function SeriesForm({ 
    selectedSeriesAdmin, selectedManufacturerAdmin, dbActions, 
    onCancel, onSaveSuccess 
}) {
    const [name, setName] = useState(selectedSeriesAdmin || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return alert("Series name required");
        
        // Call the rename logic from useCatalogData
        dbActions.renameSeries(selectedManufacturerAdmin, selectedSeriesAdmin, name.trim());
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="font-bold mb-4">Edit Series Name</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="text-xs font-bold block mb-1">Series Name</label>
                    <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        Renaming this will update all Enclosures and Components that belong to this series.
                    </p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={onCancel} className="text-sm text-slate-500">Cancel</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button>
                </div>
            </form>
        </div>
    );
}