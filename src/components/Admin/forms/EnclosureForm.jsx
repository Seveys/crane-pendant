import React, { useState } from 'react';
import { Upload, Loader2, ImageIcon } from 'lucide-react';

export default function EnclosureForm({ editItem, dbActions, selectedManufacturerAdmin, selectedSeriesAdmin, onCancel, onSaveSuccess }) {
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const modelInput = document.querySelector('input[name="model"]');
        const baseName = editItem?.model || modelInput?.value || 'enclosure';

        setUploading(true);
        try {
            const url = await dbActions.uploadImage(file, 'images', baseName);
            setTempImage(url);
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const activeSeries = selectedSeriesAdmin || formData.get('new_series_name');
        if (!activeSeries) { alert("Series Name Required"); return; }

        const supportedSR = [];
        if (formData.get('sr_internal') === 'on') supportedSR.push('internal');
        if (formData.get('sr_external') === 'on') supportedSR.push('external');

        const newItem = { 
            id: editItem?.id || `enc-${Date.now()}`, 
            series: activeSeries, 
            model: formData.get('model'), 
            kcid: formData.get('kcid'), 
            holes: parseInt(formData.get('holes')), 
            depth: formData.get('depth'), 
            max_contact_depth: parseInt(formData.get('max_contact_depth')), 
            accepted_od_min: parseFloat(formData.get('accepted_od_min')) || 0,
            accepted_od_max: parseFloat(formData.get('accepted_od_max')) || 0,
            supportedStrainRelief: supportedSR, 
            image: tempImage
        }; 
        
        dbActions.saveEnclosure(selectedManufacturerAdmin, newItem);
        onSaveSuccess();
    };

    return (
        <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Enclosure</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {!selectedSeriesAdmin && (
                    <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <label className="text-xs font-bold text-yellow-800">New Series Name</label>
                        <input name="new_series_name" placeholder="e.g. L-Series" className="w-full border p-2 rounded mt-1" required />
                    </div>
                )}

                <div className="col-span-2"><label className="text-xs font-bold">Model</label><input name="model" defaultValue={editItem?.model} required className="w-full border p-2 rounded"/></div>
                <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Holes</label><input name="holes" type="number" defaultValue={editItem?.holes || 2} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Depth</label><input name="depth" defaultValue={editItem?.depth || 'Standard'} className="w-full border p-2 rounded"/></div>
                
                <div><label className="text-xs font-bold">OD Min</label><input name="accepted_od_min" type="number" step="0.001" defaultValue={editItem?.accepted_od_min} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">OD Max</label><input name="accepted_od_max" type="number" step="0.001" defaultValue={editItem?.accepted_od_max} className="w-full border p-2 rounded"/></div>

                <div className="col-span-2">
                    <label className="text-xs font-bold">Strain Relief</label>
                    <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_internal" defaultChecked={editItem?.supportedStrainRelief?.includes('internal')} /> Internal</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_external" defaultChecked={editItem?.supportedStrainRelief?.includes('external')} /> External</label>
                    </div>
                </div>
                
                <div className="col-span-4">
                    <label className="text-xs font-bold block mb-1">Image</label>
                    <div className="flex items-center gap-2">
                        {tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : <ImageIcon size={24} className="text-slate-300"/>}
                        <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1">
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                
                <div className="col-span-4 flex justify-end mt-2 gap-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                </div>
            </form>
        </div>
    );
}