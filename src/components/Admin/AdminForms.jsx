import React from 'react';
import { Upload, FileText, FilePlus, Trash2, ImageIcon } from 'lucide-react';

export default function AdminForms({
    // Data & Setters
    manufacturers, setManufacturers,
    seriesData, setSeriesData,
    cables, setCables,
    accessories, setAccessories,
    componentTypes, setComponentTypes,
    footerConfig, setFooterConfig,
    
    // State from Panel
    globalTab,
    selectedManufacturerAdmin,
    selectedSeriesAdmin,
    adminSubTab,
    editItem,
    tempImage, setTempImage,
    tempDocs, setTempDocs,
    
    // Actions
    onCancel,
    onSaveSuccess
}) {

    // --- UPLOAD HANDLERS ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTempImage(reader.result);
            reader.readAsDataURL(file);
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

    // --- SUBMIT: MANUFACTURER ---
    const handleSaveManufacturer = (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        const newItem = { 
            id: editItem ? editItem.id : formData.get('id').toLowerCase().replace(/\s+/g, '-'), 
            name: formData.get('name'), 
            color: 'bg-slate-500', 
            isActive: true, 
            image: tempImage || editItem?.image 
        }; 
        
        setManufacturers(prev => editItem ? prev.map(m => m.id === newItem.id ? newItem : m) : [...prev, newItem]); 
        
        if(!editItem) {
            // Initialize empty series data for new manufacturer
            setSeriesData(prev => ({
                ...prev, 
                [newItem.id]: { name: newItem.name + " Series", description: "Default", isActive: true, enclosures: [], preconfigurations: [] }
            }));
        }
        onSaveSuccess();
    };

    // --- SUBMIT: CABLE ---
    const handleSaveCable = (e) => { 
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
            image: tempImage || editItem?.image 
        }; 
        
        const existsIndex = cables.findIndex(c => c.part === newItem.part); 
        if (existsIndex >= 0 && editItem) { 
            const updated = [...cables]; updated[existsIndex] = newItem; setCables(updated); 
        } else { 
            setCables(prev => [...prev, newItem]); 
        } 
        onSaveSuccess(); 
    };

    // --- SUBMIT: COMPONENT ---
    const handleSaveComponent = (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        const scope = formData.get('scope'); 
        let seriesValue = 'global'; 
        if (scope === 'manufacturer') seriesValue = selectedManufacturerAdmin; 
        if (scope === 'series') seriesValue = selectedSeriesAdmin; 
        
        const existingDocs = editItem?.docs || [];
        const finalDocs = [...existingDocs, ...tempDocs];

        const newItem = { 
            id: formData.get('id'), 
            series: seriesValue, 
            name: formData.get('name'), 
            partNumber: formData.get('partNumber'), 
            kcid: formData.get('kcid'), 
            wires: parseInt(formData.get('wires')), 
            holes: parseInt(formData.get('holes')), 
            color: formData.get('color'), 
            label: formData.get('label'), 
            desc: formData.get('desc'), 
            image: tempImage || editItem?.image,
            docs: finalDocs
        }; 
        
        const existsIndex = componentTypes.findIndex(c => c.id === newItem.id); 
        if (existsIndex >= 0 && editItem) { 
            const updated = [...componentTypes]; updated[existsIndex] = newItem; setComponentTypes(updated); 
        } else { 
            setComponentTypes(prev => [...prev, newItem]); 
        } 
        onSaveSuccess(); 
    };

    // --- SUBMIT: ENCLOSURE (FIXED) ---
    const handleSaveEnclosure = (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.target); 
        const supportedSR = []; 
        if (formData.get('sr_internal') === 'on') supportedSR.push('internal'); 
        if (formData.get('sr_external') === 'on') supportedSR.push('external'); 
        
        // Use selected series, or the custom input if creating new
        const activeSeries = selectedSeriesAdmin || formData.get('new_series_name');

        if (!activeSeries) {
            alert("Please enter a Series Name.");
            return;
        }

        const newItem = { 
            id: formData.get('id') || `enc-${Date.now()}`, 
            series: activeSeries, 
            model: formData.get('model'), 
            kcid: formData.get('kcid'), 
            holes: parseInt(formData.get('holes')), 
            depth: formData.get('depth'), 
            max_contact_depth: parseInt(formData.get('max_contact_depth')), 
            supportedStrainRelief: supportedSR, 
            image: tempImage || editItem?.image 
        }; 
        
        const newData = { ...seriesData }; 
        const mData = newData[selectedManufacturerAdmin]; 
        
        // Safety check
        if (mData && mData.enclosures) {
            const index = mData.enclosures.findIndex(e => e.id === newItem.id); 
            if (index >= 0) mData.enclosures[index] = newItem; 
            else mData.enclosures.push(newItem); 
            setSeriesData(newData); 
            onSaveSuccess(); 
        } else {
            alert("Error: Manufacturer data not found.");
        }
    };

    // --- FORM RENDERERS ---

    if (globalTab === 'footer') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
                 <h3 className="font-bold text-lg mb-4 text-slate-700">Footer Configuration</h3>
                 <form onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.target);
                     setFooterConfig(prev => ({ ...prev, credits: formData.get('credits') }));
                     onSaveSuccess();
                 }}>
                    <label className="block mb-2 text-sm font-bold">Credits Text</label>
                    <input name="credits" defaultValue={footerConfig.credits} className="w-full border p-2 rounded mb-4"/>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Footer</button>
                 </form>
            </div>
        );
    }

    if (globalTab === 'add-mfg' || (selectedManufacturerAdmin && !selectedSeriesAdmin && isEditing && !adminSubTab)) {
        // NOTE: added !adminSubTab check so we don't show this if we are trying to add an enclosure to a new mfg
        return (
            <div className="bg-white p-6 rounded shadow-lg max-w-lg">
                <h3 className="font-bold mb-4">{editItem || selectedManufacturerAdmin ? 'Edit' : 'Add'} Manufacturer</h3>
                <form onSubmit={handleSaveManufacturer} className="space-y-4">
                    {/* Fix: Explicitly check for add-mfg mode to ensure ID field is shown */}
                    {(!editItem || globalTab === 'add-mfg') && (
                        <div><label className="text-xs font-bold">ID (Slug)</label><input name="id" required className="w-full border p-2 rounded"/></div>
                    )}
                    <div><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name || manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name} required className="w-full border p-2 rounded"/></div>
                    <div>
                        <label className="text-xs font-bold block mb-1">Logo Image</label>
                        <div className="flex items-center gap-2">
                            {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-16 h-16 object-contain border rounded" />)}
                            <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1">
                                <Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onCancel} className="text-sm text-slate-500">Cancel</button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button>
                    </div>
                </form>
            </div>
        );
    }

    if (globalTab === 'cables') {
        return (
            <div className="bg-white p-4 mb-4 rounded shadow border max-w-4xl">
                <h3 className="font-bold mb-4">Edit Cable</h3>
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
                            <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                        </div>
                    </div>
                    <div className="col-span-4 flex justify-end gap-2 mt-2">
                        <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                    </div>
                </form>
            </div>
        );
    }

    if (adminSubTab === 'enclosures') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                <h3 className="font-bold mb-4">Edit Enclosure</h3>
                <form onSubmit={handleSaveEnclosure} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input type="hidden" name="id" value={editItem?.id || ''} />
                    
                    {/* NEW SERIES INPUT FIX: If no series is selected, allow user to type one */}
                    {!selectedSeriesAdmin && (
                        <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <label className="text-xs font-bold text-yellow-800">New Series Name</label>
                            <input name="new_series_name" placeholder="e.g. L-Series" className="w-full border p-2 rounded mt-1" required />
                            <p className="text-[10px] text-yellow-600 mt-1">Creating this enclosure will create a new series.</p>
                        </div>
                    )}

                    <div className="col-span-2"><label className="text-xs font-bold">Model</label><input name="model" defaultValue={editItem?.model} required className="w-full border p-2 rounded"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Holes</label><input name="holes" type="number" defaultValue={editItem?.holes || 2} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Depth</label><input name="depth" defaultValue={editItem?.depth || 'Standard'} className="w-full border p-2 rounded"/></div>
                    
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
                            <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                        </div>
                    </div>
                    
                    <div className="col-span-4 flex justify-end mt-2 gap-2">
                        <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                    </div>
                </form>
            </div>
        );
    }

    if (adminSubTab === 'components') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                <h3 className="font-bold mb-4">Edit Component</h3>
                <form onSubmit={handleSaveComponent} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-3 bg-blue-50 p-2 rounded">
                        <label className="text-xs font-bold text-blue-800">Scope</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-1 text-xs"><input type="radio" name="scope" value="manufacturer" defaultChecked={editItem?.series === selectedManufacturerAdmin} /> Manufacturer</label>
                            <label className="flex items-center gap-1 text-xs"><input type="radio" name="scope" value="series" defaultChecked={editItem?.series === selectedSeriesAdmin} /> Series</label>
                        </div>
                    </div>
                    
                    <div><label className="text-xs font-bold">ID</label><input name="id" defaultValue={editItem?.id} required className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-2 rounded"/></div>
                    <div className="col-span-1"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Holes Required</label><input name="holes" type="number" defaultValue={editItem?.holes || 1} className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold">Wires</label><input name="wires" type="number" defaultValue={editItem?.wires || 0} className="w-full border p-2 rounded"/></div>
                    
                    <div className="col-span-3">
                        <label className="text-xs font-bold block mb-1">Component Image</label>
                        <div className="flex items-center gap-3">
                            {tempImage ? <img src={tempImage} className="w-12 h-12 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-12 h-12 object-contain border rounded" />)}
                            <label className="cursor-pointer bg-slate-100 px-3 py-2 rounded text-xs hover:bg-slate-200 flex items-center gap-1"><Upload size={12}/> Upload <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
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
                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"><Upload size={12}/> Add Documents <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} /></label>
                    </div>

                    <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-2">
                        <button type="button" onClick={onCancel} className="text-sm">Cancel</button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                    </div>
                </form>
            </div>
        );
    }

    return null;
}