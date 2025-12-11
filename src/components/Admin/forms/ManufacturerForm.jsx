import React, { useState } from 'react';
import { Upload, Loader2, ImageIcon } from 'lucide-react';

export default function ManufacturerForm({ editItem, dbActions, onCancel, onSaveSuccess, manufacturers }) {
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Logic specific to Manufacturers
        const nameInput = document.querySelector('input[name="name"]');
        const baseName = editItem?.id || nameInput?.value || 'mfg';

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
        
        // Auto-generate ID logic specific to Manufacturers
        let id = editItem ? editItem.id : formData.get('name').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        if (!editItem) {
            const exists = manufacturers.some(m => m.id === id);
            if (exists) id = `${id}-${Date.now()}`;
        }

        const newItem = { 
            id: id, 
            name: formData.get('name'), 
            color: 'bg-slate-500', 
            isActive: formData.get('isActive') === 'on', 
            order: parseInt(formData.get('order')) || 0,
            image: tempImage
        }; 
        
        dbActions.saveManufacturer(newItem);
        onSaveSuccess();
    };

    const defaultName = editItem ? editItem.name : '';
    const defaultOrder = editItem?.order || (manufacturers.length + 1);

    return (
        <div className="bg-white p-6 rounded shadow-lg max-w-lg">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Manufacturer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">ID (Auto-Generated)</label>
                    <input name="id" defaultValue={editItem?.id || 'Generated from name'} disabled className="w-full border p-2 rounded bg-slate-100 text-slate-500 cursor-not-allowed"/>
                </div>
                <div><label className="text-xs font-bold">Name</label><input name="name" defaultValue={defaultName} required className="w-full border p-2 rounded"/></div>
                
                <div className="flex gap-4">
                     <div className="flex-1"><label className="text-xs font-bold">Display Order</label><input type="number" name="order" defaultValue={defaultOrder} className="w-full border p-2 rounded"/></div>
                     <div className="flex-1 flex items-end">
                         <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border w-full h-[42px]">
                            <input type="checkbox" name="isActive" id="isActive" defaultChecked={editItem ? editItem.isActive : true} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">Active</label>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold block mb-1">Logo Image</label>
                    <div className="flex items-center gap-2">
                        {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : <ImageIcon size={24} className="text-slate-300"/>}
                        <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1">
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="text-sm text-slate-500">Cancel</button>
                    <button disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button>
                </div>
            </form>
        </div>
    );
}