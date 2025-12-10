import React, { useState } from 'react';
import { Upload, FileText, FilePlus, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

export default function ComponentForm({ 
    editItem, dbActions, selectedSeriesAdmin, 
    onCancel, onSaveSuccess 
}) {
    const [tempImage, setTempImage] = useState(null);
    const [tempDocs, setTempDocs] = useState([]);
    const [uploading, setUploading] = useState(false);
    
    // Local state for conditional rendering
    const [compType, setCompType] = useState(editItem?.type || 'button');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!storage) { alert("Storage not configured."); return; }

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

    const handleDocUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempDocs(prev => [...prev, { name: file.name, type: file.type, size: (file.size / 1024).toFixed(1) + ' KB', data: reader.result }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const existingDocs = editItem?.docs || [];
        const finalDocs = [...existingDocs, ...tempDocs];

        const newItem = {
            id: formData.get('id'),
            series: selectedSeriesAdmin,
            name: formData.get('name'),
            partNumber: formData.get('partNumber'), // <--- SAVED HERE
            kcid: formData.get('kcid'),
            
            type: formData.get('type'),
            category: formData.get('category') || null,
            
            wires: parseInt(formData.get('wires')),
            holes: parseInt(formData.get('holes')),
            color: formData.get('color'),
            label: formData.get('label'),
            desc: formData.get('desc'),
            image: tempImage || editItem?.image || null,
            docs: finalDocs
        };
        dbActions.saveComponent(newItem);
        onSaveSuccess();
    };

    return (
        <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
            <h3 className="font-bold mb-4">Edit Component ({selectedSeriesAdmin})</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* ID & KCID */}
                <div><label className="text-xs font-bold">ID</label><input name="id" defaultValue={editItem?.id} required className="w-full border p-2 rounded" /></div>
                <div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-2 rounded" /></div>
                
                {/* PART NUMBER FIELD */}
                <div><label className="text-xs font-bold">Part #</label><input name="partNumber" defaultValue={editItem?.partNumber} className="w-full border p-2 rounded" /></div>
                
                {/* NAME */}
                <div className="col-span-1"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded" /></div>
                
                {/* TYPE SELECTOR */}
                <div>
                    <label className="text-xs font-bold">Type</label>
                    <select 
                        name="type" 
                        value={compType} 
                        onChange={(e) => setCompType(e.target.value)}
                        className="w-full border p-2 rounded"
                    >
                        <option value="button">Button</option>
                        <option value="light">Light</option>
                        <option value="switch">Switch</option>
                        <option value="empty">Empty/Blank</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* CATEGORY SELECTOR (Conditional) */}
                {compType === 'button' && (
                    <div>
                        <label className="text-xs font-bold">Button Function</label>
                        <select name="category" defaultValue={editItem?.category || 'single_speed'} className="w-full border p-2 rounded">
                            <option value="single_speed">Single Speed</option>
                            <option value="two_speed">Two Speed</option>
                            <option value="three_speed">Three Speed</option>
                            <option value="four_speed">Four Speed</option>
                            <option value="five_speed">Five Speed</option>
                            <option value="six_speed">Six Speed</option>
                            <option value="on_off">On / Off</option>
                            <option value="estop">E-Stop</option>
                        </select>
                    </div>
                )}
                
                {/* HOLES & WIRES */}
                <div><label className="text-xs font-bold">Holes Required</label><input name="holes" type="number" defaultValue={editItem?.holes || 1} className="w-full border p-2 rounded" /></div>
                <div><label className="text-xs font-bold">Wires</label><input name="wires" type="number" defaultValue={editItem?.wires || 0} className="w-full border p-2 rounded" /></div>
                
                {/* IMAGE UPLOAD */}
                <div className="col-span-3">
                    <label className="text-xs font-bold block mb-1">Component Image</label>
                    <div className="flex items-center gap-3">
                        {tempImage ? <img src={tempImage} className="w-12 h-12 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-12 h-12 object-contain border rounded" />)}
                        <label className={`cursor-pointer bg-slate-100 px-3 py-2 rounded text-xs hover:bg-slate-200 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                            {uploading ? 'Uploading...' : 'Upload'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                {/* DOCUMENTATION */}
                <div className="col-span-3 border-t pt-3 mt-1">
                    <label className="text-xs font-bold block mb-2 text-slate-500 uppercase">Documentation</label>
                    <div className="space-y-2 mb-2">
                        {editItem?.docs?.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border">
                                <span className="flex items-center gap-2"><FileText size={12} /> {d.name}</span>
                            </div>
                        ))}
                        {tempDocs.map((d, i) => (
                            <div key={`new-${i}`} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded border border-green-200 text-green-700">
                                <span className="flex items-center gap-2"><FilePlus size={12} /> {d.name} (New)</span>
                            </div>
                        ))}
                    </div>
                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"><Upload size={12} /> Add Documents <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} /></label>
                </div>

                <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
                    <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                    <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Save</button>
                </div>
            </form>
        </div>
    );
}