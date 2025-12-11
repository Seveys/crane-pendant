import React, { useState } from 'react';
import { Upload, ImageIcon, Loader2, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

export default function AccessoryForm({ editItem, dbActions, onCancel, onSaveSuccess }) {
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) {
            alert("Storage not configured.");
            return;
        }

        try {
            setUploading(true);
            const storageRef = ref(storage, `images/accessories/${Date.now()}_${file.name}`);
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
            // Use KCID as the ID if available, otherwise a unique ID
            id: formData.get('kcid') || editItem?.id || `acc-${Date.now()}`,
            kcid: formData.get('kcid'),
            partNumber: formData.get('partNumber'), 
            name: formData.get('name'),
            description: formData.get('description'),
            image: tempImage || null
        };
        
        // Use the generic saveAccessory action
        dbActions.saveAccessory(newItem);
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-4 mb-4 rounded shadow border max-w-2xl">
            <h3 className="font-bold mb-4">Edit Accessory</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                
                {/* Part Number & KCID */}
                <div><label className="text-xs font-bold">Part #</label><input name="partNumber" defaultValue={editItem?.partNumber} required className="w-full border p-2 rounded" /></div>
                <div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded" /></div>
                
                {/* Name */}
                <div className="col-span-2"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded" /></div>
                
                {/* Description */}
                <div className="col-span-2">
                    <label className="text-xs font-bold">Description</label>
                    <textarea name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded text-sm" placeholder="Short description of the accessory..." />
                </div>
                
                {/* Image Upload */}
                <div className="col-span-2 border-t pt-4">
                    <label className="text-xs font-bold block mb-1">Accessory Image</label>
                    <div className="flex items-center gap-3">
                        {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : <ImageIcon size={32} className="text-slate-300"/>}
                        <label className={`cursor-pointer bg-slate-200 px-3 py-2 rounded text-xs hover:bg-slate-300 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                            {uploading ? 'Uploading...' : 'Upload Image'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        {tempImage && (
                            <button type="button" onClick={() => setTempImage(null)} className="text-red-500 hover:text-red-700 p-1">
                                <X size={16}/>
                            </button>
                        )}
                    </div>
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Save</button>
                </div>
            </form>
        </div>
    );
}