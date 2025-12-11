import React, { useState } from 'react';
import { Upload, FileText, FilePlus, Trash2, ImageIcon, Loader2 } from 'lucide-react';

export default function ComponentForm({ editItem, dbActions, selectedSeriesAdmin, onCancel, onSaveSuccess }) {
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [tempDocs, setTempDocs] = useState(editItem?.docs || []);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const partInput = document.querySelector('input[name="partNumber"]');
        const baseName = editItem?.partNumber || partInput?.value || 'component';

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

    const handleDocUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempDocs(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    data: reader.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        if (!selectedSeriesAdmin) {
            alert("Error: No series selected.");
            return;
        }

        const newItem = { 
            id: editItem?.id || `comp-${Date.now()}`,
            series: selectedSeriesAdmin,
            name: formData.get('name'), 
            partNumber: formData.get('partNumber'), 
            kcid: formData.get('kcid'), 
            type: formData.get('type'),
            category: formData.get('category'),
            wires: parseInt(formData.get('wires')), 
            holes: parseInt(formData.get('holes')), 
            color: formData.get('color'), 
            description: formData.get('description'), 
            image: tempImage,
            docs: tempDocs
        }; 
        dbActions.saveComponent(newItem);
        onSaveSuccess(); 
    };

    return (
        <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
            <h3 className="font-bold mb-4">{editItem ? 'Edit' : 'Add'} Component</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Part #</label><input name="partNumber" defaultValue={editItem?.partNumber} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded"/></div>
                
                <div>
                    <label className="text-xs font-bold block mb-1">Type</label>
                    <select name="type" defaultValue={editItem?.type || 'button'} className="w-full border p-2 rounded bg-white">
                        <option value="button">Push Button</option>
                        <option value="light">Pilot Light (Standard)</option>
                        <option value="selector">Selector Switch</option>
                        <option value="potentiometer">Potentiometer</option>
                        <option value="blank">Blank Plug</option>
                        <option value="pilot_horn">Pilot Light / Horn Switch (Housing Acc.)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold block mb-1">Function Category</label>
                    <select name="category" defaultValue={editItem?.category || 'momentary'} className="w-full border p-2 rounded bg-white">
                        <option value="momentary">Momentary</option>
                        <option value="on_off">On / Off</option>
                        <option value="estop">E-Stop</option>
                        <option value="maintained">Maintained</option>
                        <option value="indicator">Indicator Only</option>
                        <option value="accessory">Accessory</option>
                    </select>
                </div>
                <div><label className="text-xs font-bold">Color</label><input name="color" defaultValue={editItem?.color} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Holes</label><input name="holes" type="number" defaultValue={editItem?.holes || 1} className="w-full border p-2 rounded"/></div>
                <div><label className="text-xs font-bold">Wires</label><input name="wires" type="number" defaultValue={editItem?.wires || 0} className="w-full border p-2 rounded"/></div>
                
                <div className="col-span-3">
                    <label className="text-xs font-bold">Description</label>
                    <textarea name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded h-20 text-sm"/>
                </div>

                <div className="col-span-3">
                    <label className="text-xs font-bold block mb-1">Image</label>
                    <div className="flex items-center gap-3">
                        {tempImage ? <img src={tempImage} className="w-12 h-12 object-contain border rounded" /> : <ImageIcon size={24} className="text-slate-300"/>}
                        <label className="cursor-pointer bg-slate-100 px-3 py-2 rounded text-xs hover:bg-slate-200 flex items-center gap-1">
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                
                <div className="col-span-3 border-t pt-3 mt-1">
                    <label className="text-xs font-bold block mb-2 text-slate-500 uppercase">Documentation</label>
                    <div className="space-y-2 mb-2">
                        {tempDocs.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border">
                                <span className="flex items-center gap-2"><FileText size={12}/> {d.name}</span>
                                <button type="button" onClick={() => setTempDocs(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"><Upload size={12}/> Add Docs <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} /></label>
                </div>

                <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                </div>
            </form>
        </div>
    );
}