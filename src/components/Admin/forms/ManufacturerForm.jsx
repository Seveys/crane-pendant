import React, { useState, useEffect } from 'react';
import { Upload, Loader2, ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase'; 

export default function ManufacturerForm({ editItem, dbActions, onCancel, onSaveSuccess }) {
    const [form, setForm] = useState({ name: '', id: '', order: 0, isActive: true });
    const [tempImage, setTempImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (editItem) {
            setForm({
                name: editItem.name || '',
                id: editItem.id || '',
                order: editItem.order || 0,
                isActive: editItem.isActive !== undefined ? editItem.isActive : true
            });
            setTempImage(null);
        } else {
            setForm({ name: '', id: '', order: 0, isActive: true });
            setTempImage(null);
        }
    }, [editItem]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) { alert("Storage not configured."); return; }

        try {
            setUploading(true);
            const storageRef = ref(storage, `images/manufacturers/${Date.now()}_${file.name}`);
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

    const handleNameChange = (e) => {
        const newName = e.target.value;
        if (!editItem) {
            const newId = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setForm(prev => ({ ...prev, name: newName, id: newId }));
        } else {
            setForm(prev => ({ ...prev, name: newName }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalId = form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (!finalId) { alert("ID is required"); return; }

        const newItem = {
            id: finalId,
            name: form.name,
            order: parseInt(form.order) || 0,
            color: 'bg-slate-500',
            isActive: form.isActive,
            image: tempImage || editItem?.image || null
        };

        dbActions.saveManufacturer(newItem);

        if (!editItem) {
            const newSeriesData = { name: newItem.name + " Series", description: "Default", isActive: true, enclosures: [], preconfigurations: [] };
            dbActions.saveSeries(newItem.id, newSeriesData);
        }
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded shadow-lg max-w-lg">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Manufacturer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold block mb-1">Name</label>
                    <input value={form.name} onChange={handleNameChange} required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Acme Corp" />
                </div>

                {(!editItem) && (
                    <div>
                        <label className="text-xs font-bold block mb-1">ID (Auto-generated)</label>
                        <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required className="w-full border p-2 rounded bg-slate-50 text-slate-600 font-mono text-sm" />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold block mb-1">Display Order</label>
                        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="w-full border p-2 rounded" placeholder="0" />
                    </div>
                    <div>
                        <label className="text-xs font-bold block mb-1">Status</label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                            <span className={`text-sm font-bold ${form.isActive ? 'text-green-600' : 'text-slate-400'}`}>{form.isActive ? 'Active' : 'Disabled'}</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold block mb-1">Logo Image</label>
                    <div className="flex items-center gap-2">
                        {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-16 h-16 object-contain border rounded" />)}
                        <label className={`cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                            {uploading ? 'Uploading...' : 'Upload'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="text-sm text-slate-500">Cancel</button>
                    <button disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50">Save</button>
                </div>
            </form>
        </div>
    );
}