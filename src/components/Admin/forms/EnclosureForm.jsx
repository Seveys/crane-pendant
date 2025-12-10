import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

export default function EnclosureForm({ 
    editItem, dbActions, selectedManufacturerAdmin, selectedSeriesAdmin, seriesData,
    onCancel, onSaveSuccess 
}) {
    const [tempImage, setTempImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!storage) { alert("Storage not configured."); return; }

        try {
            setUploading(true);
            const storageRef = ref(storage, `images/enclosures/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            setTempImage(url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Image upload failed!");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const supportedSR = [];
        if (formData.get('sr_internal') === 'on') supportedSR.push('internal');
        if (formData.get('sr_external') === 'on') supportedSR.push('external');

        const activeSeries = selectedSeriesAdmin || formData.get('new_series_name');
        if (!activeSeries) { alert("Please enter a Series Name."); return; }

        const newItem = {
            id: formData.get('id') || `enc-${Date.now()}`,
            series: activeSeries,
            model: formData.get('model'),
            kcid: formData.get('kcid'),
            holes: parseInt(formData.get('holes')),
            depth: formData.get('depth'),
            max_contact_depth: parseInt(formData.get('max_contact_depth')),
            supportedStrainRelief: supportedSR,
            image: tempImage || editItem?.image || null
        };

        const currentSeries = seriesData[selectedManufacturerAdmin] || {
            name: selectedManufacturerAdmin + " Series", description: "Default", isActive: true, enclosures: [], preconfigurations: []
        };

        const newEnclosures = [...(currentSeries.enclosures || [])];
        const index = newEnclosures.findIndex(e => e.id === newItem.id);
        if (index >= 0) newEnclosures[index] = newItem;
        else newEnclosures.push(newItem);

        dbActions.saveSeries(selectedManufacturerAdmin, { ...currentSeries, enclosures: newEnclosures });
        onSaveSuccess();
    };

    return (
        <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
            <h3 className="font-bold mb-4">Edit Enclosure</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input type="hidden" name="id" value={editItem?.id || ''} />
                {!selectedSeriesAdmin && (
                    <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <label className="text-xs font-bold text-yellow-800">New Series Name</label>
                        <input name="new_series_name" placeholder="e.g. L-Series" className="w-full border p-2 rounded mt-1" required />
                        <p className="text-[10px] text-yellow-600 mt-1">Creating this enclosure will create a new series.</p>
                    </div>
                )}
                <div className="col-span-2"><label className="text-xs font-bold">Model</label><input name="model" defaultValue={editItem?.model} required className="w-full border p-2 rounded" /></div>
                <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded" /></div>
                <div><label className="text-xs font-bold">Holes</label><input name="holes" type="number" defaultValue={editItem?.holes || 2} className="w-full border p-2 rounded" /></div>
                <div><label className="text-xs font-bold">Depth</label><input name="depth" defaultValue={editItem?.depth || 'Standard'} className="w-full border p-2 rounded" /></div>
                <div>
                    <label className="text-xs font-bold">Strain Relief</label>
                    <div className="flex flex-col gap-1 mt-1">
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_internal" defaultChecked={editItem?.supportedStrainRelief?.includes('internal')} /> Internal</label>
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_external" defaultChecked={editItem?.supportedStrainRelief?.includes('external')} /> External</label>
                    </div>
                </div>
                <div className="col-span-4">
                    <label className="text-xs font-bold block mb-1">Enclosure Image</label>
                    <div className="flex items-center gap-2">
                        {tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}
                        <label className={`cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                            {uploading ? 'Uploading...' : 'Upload'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="col-span-4 flex justify-end mt-2 gap-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Save</button>
                </div>
            </form>
        </div>
    );
}