import React, { useState } from 'react';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

export default function CableForm({ editItem, dbActions, onCancel, onSaveSuccess }) {
    const [tempImage, setTempImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!storage) { alert("Storage not configured."); return; }

        try {
            setUploading(true);
            const storageRef = ref(storage, `images/cables/${Date.now()}_${file.name}`);
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
        
        const newItem = {
            part: formData.get('part'),
            kcid: formData.get('kcid'),
            description: formData.get('description'),
            type: formData.get('description'), 
            conductors: parseInt(formData.get('conductors')),
            awg: parseInt(formData.get('awg')),
            
            // CHANGED: Single OD field instead of Min/Max
            od: parseFloat(formData.get('od')),
            
            strainRelief: formData.get('strainRelief'),
            image: tempImage || editItem?.image || null
        };
        dbActions.saveCable(newItem);
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-4 mb-4 rounded shadow border max-w-4xl">
            <h3 className="font-bold mb-4">Edit Cable</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
                <div className="col-span-2"><label className="text-xs font-bold">Part #</label><input name="part" defaultValue={editItem?.part} className="w-full border p-1 rounded" /></div>
                <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-1 rounded" /></div>
                
                <div className="col-span-4">
                    <label className="text-xs font-bold">Description</label>
                    <textarea name="description" defaultValue={editItem?.description || editItem?.type} className="w-full border p-2 rounded mt-1 h-24 text-sm" placeholder="Cable description..." />
                </div>

                <div><label className="text-xs font-bold">Conductors</label><input name="conductors" type="number" defaultValue={editItem?.conductors} className="w-full border p-1 rounded" /></div>
                <div><label className="text-xs font-bold">AWG</label><input name="awg" type="number" defaultValue={editItem?.awg || 16} className="w-full border p-1 rounded" /></div>
                
                {/* CHANGED: Single OD Input */}
                <div className="col-span-1">
                    <label className="text-xs font-bold">Outside Diameter (in)</label>
                    {/* Fallback to od_max if editing an old item that doesn't have 'od' yet */}
                    <input name="od" type="number" step="0.01" defaultValue={editItem?.od || editItem?.od_max} className="w-full border p-1 rounded" />
                </div>
                
                <div>
                    <label className="text-xs font-bold">Strain Relief</label>
                    <select name="strainRelief" defaultValue={editItem?.strainRelief || 'external'} className="w-full border p-1 rounded">
                        <option value="external">External</option>
                        <option value="internal">Internal</option>
                        <option value="none">No Strain</option>
                    </select>
                </div>

                <div className="col-span-4">
                    <label className="text-xs font-bold block mb-1">Cable Image</label>
                    <div className="flex items-center gap-2">
                        {tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : <ImageIcon size={24} className="text-slate-300" />}
                        <label className={`cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                            {uploading ? 'Uploading...' : 'Upload'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="col-span-4 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Save</button>
                </div>
            </form>
        </div>
    );
}