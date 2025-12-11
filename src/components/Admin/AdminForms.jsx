import React, { useState } from 'react';
import { Upload, FileText, FilePlus, Trash2, ImageIcon, Loader2 } from 'lucide-react';

export default function AdminForms({
    // Data
    manufacturers, seriesData, cables, accessories, componentTypes, footerConfig,
    // Actions
    dbActions,
    // UI State
    globalTab, selectedManufacturerAdmin, selectedSeriesAdmin, adminSubTab, editItem,
    // Form State
    tempImage, setTempImage, tempDocs, setTempDocs,
    onCancel, onSaveSuccess, onDelete
}) {
    const [uploading, setUploading] = useState(false);

    // --- UPLOAD HANDLER ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        let baseName = null;
        const getValue = (name) => {
            const input = document.querySelector(`input[name="${name}"]`);
            return input ? input.value : (editItem ? editItem[name] : null);
        };

        if (globalTab === 'cables') {
            baseName = getValue('part');
        } else if (adminSubTab === 'components') {
            baseName = getValue('partNumber');
        } else if (adminSubTab === 'enclosures') {
            baseName = getValue('model');
        } else if (globalTab === 'add-mfg' || !adminSubTab) {
            baseName = getValue('id') || getValue('name');
        }

        if (!baseName) {
            if(!confirm("No Part Number/Model entered. File will use timestamp. Continue?")) return;
        }

        setUploading(true);
        try {
            const url = await dbActions.uploadImage(file, 'images', baseName);
            setTempImage(url);
        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    // --- SAVE MANUFACTURER ---
    const handleSaveManufacturer = async (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        
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
            image: tempImage || editItem?.image || null
        }; 
        await dbActions.saveManufacturer(newItem);
        onSaveSuccess();
    };

    // --- SAVE CABLE ---
    const handleSaveCable = async (e) => { 
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
            image: tempImage || editItem?.image || null
        }; 
        await dbActions.saveCable({ ...newItem, id: newItem.part });
        onSaveSuccess(); 
    };

    // --- SAVE COMPONENT ---
    const handleSaveComponent = async (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        
        if (!selectedSeriesAdmin) {
            alert("Error: No series selected context.");
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
            image: tempImage || editItem?.image || null,
            docs: tempDocs
        }; 
        await dbActions.saveComponent(newItem);
        onSaveSuccess(); 
    };

    // --- SAVE ENCLOSURE (FIXED) ---
    const handleSaveEnclosure = async (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        const supportedSR = []; 
        if (formData.get('sr_internal') === 'on') supportedSR.push('internal'); 
        if (formData.get('sr_external') === 'on') supportedSR.push('external'); 
        
        const activeSeries = selectedSeriesAdmin || formData.get('new_series_name');
        if (!activeSeries) { alert("Series Name Required"); return; }

        const newItem = { 
            id: editItem?.id || `enc-${Date.now()}`, 
            series: activeSeries, 
            model: formData.get('model'), 
            kcid: formData.get('kcid'), 
            holes: parseInt(formData.get('holes')), 
            depth: formData.get('depth'), 
            max_contact_depth: parseInt(formData.get('max_contact_depth')), 
            
            // --- NEW: OD LIMITS ---
            accepted_od_min: parseFloat(formData.get('accepted_od_min')) || 0,
            accepted_od_max: parseFloat(formData.get('accepted_od_max')) || 0,
            
            supportedStrainRelief: supportedSR, 
            image: tempImage || editItem?.image || null
        }; 
        
        await dbActions.saveEnclosure(selectedManufacturerAdmin, newItem);
        onSaveSuccess();
    };

    // --- FORM RENDERERS ---

    if (globalTab === 'footer') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
                 <h3 className="font-bold text-lg mb-4 text-slate-700">Footer Configuration</h3>
                 <form onSubmit={async (e) => {
                     e.preventDefault();
                     const formData = new FormData(e.target);
                     await dbActions.saveFooter({ credits: formData.get('credits'), links: footerConfig.links });
                     onSaveSuccess();
                 }}>
                    <label className="block mb-2 text-sm font-bold">Credits Text</label>
                    <input name="credits" defaultValue={footerConfig.credits} className="w-full border p-2 rounded mb-4"/>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Footer</button>
                 </form>
            </div>
        );
    }

    if (globalTab === 'add-mfg' || (selectedManufacturerAdmin && !selectedSeriesAdmin && !adminSubTab)) {
        const defaultName = editItem ? editItem.name : '';
        const defaultOrder = editItem?.order || (manufacturers.length + 1);

        return (
            <div className="bg-white p-6 rounded shadow-lg max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{editItem ? 'Edit Manufacturer' : 'Add Manufacturer'}</h3>
                    {editItem && onDelete && (
                        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50" title="Delete Manufacturer">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSaveManufacturer} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">ID (Auto-Generated)</label>
                        <input name="id" defaultValue={editItem?.id || 'Will be generated from name'} disabled={true} className="w-full border p-2 rounded bg-slate-100 text-slate-500 cursor-not-allowed"/>
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
                            {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-16 h-16 object-contain border rounded" />)}
                            <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1">
                                {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                                {uploading ? 'Uploading...' : 'Upload'}
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

    if (globalTab === 'cables') {
        return (
            <div className="bg-white p-4 mb-4 rounded shadow border max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{editItem ? 'Edit Cable' : 'Add Cable'}</h3>
                    {editItem && onDelete && (
                        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50" title="Delete Cable">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSaveCable} className="grid grid-cols-4 gap-4">
                    <div className="col-span-2"><label className="text-xs font-bold">Part #</label><input name="part" defaultValue={editItem?.part} className="w-full border p-1 rounded"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">Type</label><input name="type" defaultValue={editItem?.type} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">Conductors</label><input name="conductors" type="number" defaultValue={editItem?.conductors} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">AWG</label><input name="awg" type="number" defaultValue={editItem?.awg || 16} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">Min OD</label><input name="od_min" type="number" step="0.01" defaultValue={editItem?.od_min} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">Max OD</label><input name="od_max" type="number" step="0.01" defaultValue={editItem?.od_max} className="w-full border p-1 rounded"/></div>
                    <div><label className="text-xs font-bold">Strain Relief</label><select name="strainRelief" defaultValue={editItem?.strainRelief || 'external'} className="w-full border p-1 rounded"><option value="external">External</option><option value="internal">Internal</option></select></div>
                    <div className="col-span-4">
                        <label className="text-xs font-bold block mb-1">Cable Image</label>
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

    if (adminSubTab === 'enclosures') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{editItem ? 'Edit Enclosure' : 'Add Enclosure'}</h3>
                    {editItem && onDelete && (
                        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50" title="Delete Enclosure">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSaveEnclosure} className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    
                    {/* --- NEW: OD LIMITS --- */}
                    <div>
                        <label className="text-xs font-bold">OD Min (in)</label>
                        <input name="accepted_od_min" type="number" step="0.001" defaultValue={editItem?.accepted_od_min} className="w-full border p-2 rounded" placeholder="0.300"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold">OD Max (in)</label>
                        <input name="accepted_od_max" type="number" step="0.001" defaultValue={editItem?.accepted_od_max} className="w-full border p-2 rounded" placeholder="0.750"/>
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs font-bold">Strain Relief</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_internal" defaultChecked={editItem?.supportedStrainRelief?.includes('internal')} /> Internal</label>
                            <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_external" defaultChecked={editItem?.supportedStrainRelief?.includes('external')} /> External</label>
                        </div>
                    </div>
                    
                    <div className="col-span-4">
                        <label className="text-xs font-bold block mb-1">Enclosure Image</label>
                        <div className="flex items-center gap-2">
                            {tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}
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

    if (adminSubTab === 'components') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{editItem ? 'Edit Component' : 'Add Component'}</h3>
                    {editItem && onDelete && (
                        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50" title="Delete Component">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSaveComponent} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    
                    <div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Part #</label><input name="partNumber" defaultValue={editItem?.partNumber} className="w-full border p-2 rounded"/></div>
                    <div className="col-span-1"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded"/></div>
                    
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
                            <option value="momentary">Momentary (Directional)</option>
                            <option value="on_off">On / Off (Start/Stop)</option>
                            <option value="estop">E-Stop / Emergency</option>
                            <option value="maintained">Maintained / Latched</option>
                            <option value="indicator">Indicator Only</option>
                            <option value="accessory">Accessory Function</option>
                        </select>
                    </div>
                    <div><label className="text-xs font-bold">Color</label><input name="color" defaultValue={editItem?.color} className="w-full border p-2 rounded" placeholder="e.g. Green, Red"/></div>

                    <div><label className="text-xs font-bold">Holes Required</label><input name="holes" type="number" defaultValue={editItem?.holes || 1} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Wires</label><input name="wires" type="number" defaultValue={editItem?.wires || 0} className="w-full border p-2 rounded"/></div>
                    
                    <div className="col-span-3">
                        <label className="text-xs font-bold">Description</label>
                        <textarea name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded h-20 text-sm"/>
                    </div>

                    <div className="col-span-3">
                        <label className="text-xs font-bold block mb-1">Component Image</label>
                        <div className="flex items-center gap-3">
                            {tempImage ? <img src={tempImage} className="w-12 h-12 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-12 h-12 object-contain border rounded" />)}
                            <label className="cursor-pointer bg-slate-100 px-3 py-2 rounded text-xs hover:bg-slate-200 flex items-center gap-1">
                                {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} Upload 
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                    
                    <div className="col-span-3 border-t pt-3 mt-1">
                        <label className="text-xs font-bold block mb-2 text-slate-500 uppercase">Documentation</label>
                        <div className="space-y-2 mb-2">
                            {editItem?.docs?.map((d, i) => (
                                <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border">
                                    <span className="flex items-center gap-2"><FileText size={12}/> {d.name}</span>
                                    <button type="button" onClick={() => { /* Handle delete logic */ }} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                                </div>
                            ))}
                            {tempDocs.map((d, i) => (
                                <div key={`new-${i}`} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded border border-green-200 text-green-700">
                                    <span className="flex items-center gap-2"><FilePlus size={12}/> {d.name} (New)</span>
                                </div>
                            ))}
                        </div>
                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"><Upload size={12}/> Add Documents <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => {
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
                        }} /></label>
                    </div>

                    <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
                        <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                        <button disabled={uploading} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                    </div>
                </form>
            </div>
        );
    }

    return null;
}