import React, { useState } from 'react';
import { Upload, Loader2, ImageIcon } from 'lucide-react';

export default function CableForm({ editItem, dbActions, onCancel, onSaveSuccess }) {
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const partInput = document.querySelector('input[name="part"]');
        const baseName = editItem?.part || partInput?.value || 'cable';

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
        const newItem = { 
            part: formData.get('part'), 
            kcid: formData.get('kcid'), 
            type: formData.get('type'), 
            conductors: parseInt(formData.get('conductors')), 
            awg: parseInt(formData.get('awg')), 
            od_min: parseFloat(formData.get('od_min')), 
            od_max: parseFloat(formData.get('od_max')), 
            strainRelief: formData.get('strainRelief'), 
            image: tempImage
        }; 
        dbActions.saveCable({ ...newItem, id: newItem.part });
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-4 mb-4 rounded shadow border max-w-4xl">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Cable</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
                <div className="col-span-2"><label className="text-xs font-bold">Part #</label><input name="part" defaultValue={editItem?.part} className="w-full border p-1 rounded"/></div>
                <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">Type</label><input name="type" defaultValue={editItem?.type} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">Cond.</label><input name="conductors" type="number" defaultValue={editItem?.conductors} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">AWG</label><input name="awg" type="number" defaultValue={editItem?.awg || 16} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">Min OD</label><input name="od_min" type="number" step="0.01" defaultValue={editItem?.od_min} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">Max OD</label><input name="od_max" type="number" step="0.01" defaultValue={editItem?.od_max} className="w-full border p-1 rounded"/></div>
                <div><label className="text-xs font-bold">Strain Relief</label><select name="strainRelief" defaultValue={editItem?.strainRelief || 'external'} className="w-full border p-1 rounded"><option value="external">External</option><option value="internal">Internal</option></select></div>
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
                <div className="col-span-4 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                </div>
            </form>
        </div>
    );
}