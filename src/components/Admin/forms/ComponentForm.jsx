import React, { useState } from 'react';
import { Upload, Loader2, ImageIcon, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

export default function ComponentForm({ 
    editItem, dbActions, selectedManufacturerAdmin, selectedSeriesAdmin, 
    onCancel, onSaveSuccess 
}) {
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
            const storageRef = ref(storage, `images/components/${Date.now()}_${file.name}`);
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
            id: editItem?.id || `comp-${Date.now()}`,
            series: selectedSeriesAdmin,
            partNumber: formData.get('partNumber'),
            kcid: formData.get('kcid'),
            name: formData.get('name'),
            description: formData.get('description'),
            type: formData.get('type'), // <--- Saves the new type here
            category: formData.get('category'),
            color: formData.get('color'),
            holes: parseInt(formData.get('holes')),
            wires: parseInt(formData.get('wires')),
            price: parseFloat(formData.get('price')),
            image: tempImage || null
        };

        dbActions.saveComponent(newItem);
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl">
            <h3 className="font-bold mb-4 text-xl text-slate-800">
                {editItem ? 'Edit Component' : 'Add New Component'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Identity */}
                <div className="col-span-2">
                    <label className="text-xs font-bold block mb-1">Part Number</label>
                    <input name="partNumber" defaultValue={editItem?.partNumber} required className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-bold block mb-1">KCID</label>
                    <input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded" />
                </div>

                <div className="col-span-3">
                    <label className="text-xs font-bold block mb-1">Name</label>
                    <input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded" />
                </div>
                
                {/* TYPE SELECTION (UPDATED) */}
                <div>
                    <label className="text-xs font-bold block mb-1">Type</label>
                    <select name="type" defaultValue={editItem?.type || 'button'} className="w-full border p-2 rounded bg-white">
                        <option value="button">Push Button</option>
                        <option value="light">Pilot Light (Standard)</option>
                        <option value="selector">Selector Switch</option>
                        <option value="potentiometer">Potentiometer</option>
                        <option value="blank">Blank Plug</option>
                        {/* NEW OPTION ADDED BELOW */}
                        <option value="pilot_horn">Pilot Light / Horn Switch (Housing Acc.)</option>
                    </select>
                </div>

                {/* Category & Color */}
                <div>
                    <label className="text-xs font-bold block mb-1">Function Category</label>
                    <select name="category" defaultValue={editItem?.category || 'momentary'} className="w-full border p-2 rounded bg-white">
                        <option value="momentary">Momentary (Directional)</option>
                        <option value="on_off">On / Off (Start/Stop)</option>
                        <option value="estop">E-Stop / Emergency</option>
                        <option value="maintained">Maintained / Latched</option>
                        <option value="indicator">Indicator Only</option>
                        <option value="accessory">Accessory Function</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold block mb-1">Color</label>
                    <input name="color" placeholder="e.g. Green, Red, Black" defaultValue={editItem?.color} className="w-full border p-2 rounded" />
                </div>

                {/* Specs */}
                <div>
                    <label className="text-xs font-bold block mb-1">Holes Required</label>
                    <input type="number" name="holes" defaultValue={editItem?.holes || 1} min="1" max="3" className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="text-xs font-bold block mb-1">Wire Count</label>
                    <input type="number" name="wires" defaultValue={editItem?.wires || 0} min="0" className="w-full border p-2 rounded" />
                </div>

                {/* Description */}
                <div className="col-span-4">
                    <label className="text-xs font-bold block mb-1">Description</label>
                    <textarea name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded text-sm h-20" />
                </div>

                {/* Image Upload */}
                <div className="col-span-4 border-t pt-4">
                    <label className="text-xs font-bold block mb-1">Component Image</label>
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

                <div className="col-span-4 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-100 rounded text-slate-700 font-bold hover:bg-slate-200 text-sm">Cancel</button>
                    <button disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-sm disabled:opacity-50">Save Component</button>
                </div>
            </form>
        </div>
    );
}